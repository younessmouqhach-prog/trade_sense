from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Course, CourseCategory, UserCourseProgress, User, UserChallenge
from sqlalchemy import and_, or_
import logging

logger = logging.getLogger(__name__)

masterclass_bp = Blueprint('masterclass', __name__)

@masterclass_bp.route('/courses', methods=['GET'])
@jwt_required()
def get_courses():
    """
    Get all available courses with user progress

    Query Parameters:
    - category: Filter by category name
    - level: Filter by level (beginner, intermediate, advanced)
    - access_level: Filter by access level (public, funded, premium)
    """
    try:
        user_id = get_jwt_identity()

        # Get query parameters
        category_filter = request.args.get('category')
        level_filter = request.args.get('level')
        access_filter = request.args.get('access_level')

        # Base query
        query = Course.query.filter_by(is_active=True)

        # Apply filters
        if category_filter:
            query = query.join(CourseCategory).filter(CourseCategory.name == category_filter)

        if level_filter:
            query = query.filter(Course.level == level_filter)

        if access_filter:
            query = query.filter(Course.access_level == access_filter)

        # Get courses with category info
        courses = query.join(CourseCategory).order_by(
            CourseCategory.order, Course.order
        ).all()

        # Check user's access permissions
        user = User.query.get(user_id)
        user_has_funded_challenge = UserChallenge.query.filter(
            UserChallenge.user_id == user_id,
            UserChallenge.status.in_(['active', 'passed', 'completed'])
        ).first() is not None

        # Format response with user progress and access control
        courses_data = []
        for course in courses:
            # Check access permissions
            can_access = (
                course.access_level == 'public' or
                (course.access_level == 'funded' and user_has_funded_challenge) or
                (course.access_level == 'premium' and user.role in ['admin', 'superadmin'])
            )

            course_data = course.to_dict(include_progress=True, user_id=user_id)
            course_data['can_access'] = can_access

            courses_data.append(course_data)

        # Get categories for filter UI
        categories = CourseCategory.query.filter_by(is_active=True).order_by(CourseCategory.order).all()
        categories_data = [cat.to_dict() for cat in categories]

        # Get user statistics
        total_courses = len(courses_data)
        completed_courses = len([c for c in courses_data if c.get('progress', {}).get('is_completed')])
        in_progress_courses = len([c for c in courses_data if c.get('progress') and not c['progress'].get('is_completed')])

        response = {
            'courses': courses_data,
            'categories': categories_data,
            'stats': {
                'total': total_courses,
                'completed': completed_courses,
                'in_progress': in_progress_courses,
                'completion_rate': round((completed_courses / total_courses * 100), 1) if total_courses > 0 else 0
            },
            'user': {
                'has_funded_access': user_has_funded_challenge,
                'role': user.role
            }
        }

        logger.info(f"User {user_id} requested {len(courses_data)} courses")
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error fetching courses: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to fetch courses'}), 500

@masterclass_bp.route('/courses/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course_detail(course_id):
    """Get detailed course information"""
    try:
        user_id = get_jwt_identity()

        course = Course.query.get_or_404(course_id)

        # Check access permissions
        user = User.query.get(user_id)
        user_has_funded_challenge = UserChallenge.query.filter(
            UserChallenge.user_id == user_id,
            UserChallenge.status.in_(['active', 'passed', 'completed'])
        ).first() is not None

        can_access = (
            course.access_level == 'public' or
            (course.access_level == 'funded' and user_has_funded_challenge) or
            (course.access_level == 'premium' and user.role in ['admin', 'superadmin'])
        )

        if not can_access:
            return jsonify({'error': 'Access denied to this course'}), 403

        course_data = course.to_dict(include_progress=True, user_id=user_id)
        course_data['can_access'] = can_access

        # Get related courses in same category
        related_courses = Course.query.filter(
            Course.category_id == course.category_id,
            Course.id != course_id,
            Course.is_active == True
        ).order_by(Course.order).limit(3).all()

        course_data['related_courses'] = [
            related.to_dict(include_progress=True, user_id=user_id)
            for related in related_courses
        ]

        logger.info(f"User {user_id} accessed course {course_id}: {course.title}")
        return jsonify(course_data), 200

    except Exception as e:
        logger.error(f"Error fetching course {course_id}: {e}")
        return jsonify({'error': 'Failed to fetch course'}), 500

@masterclass_bp.route('/progress', methods=['POST'])
@jwt_required()
def update_progress():
    """
    Update user course progress

    Request Body:
    - course_id: Course ID
    - progress_percent: Progress percentage (0-100)
    - last_watched_position: Last watched position in seconds
    - notes: User notes (optional)
    - quiz_score: Quiz score (optional)
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()

        required_fields = ['course_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        course_id = data['course_id']
        progress_percent = data.get('progress_percent', 0)
        last_watched_position = data.get('last_watched_position', 0)
        notes = data.get('notes')
        quiz_score = data.get('quiz_score')

        # Validate progress percent
        if not (0 <= progress_percent <= 100):
            return jsonify({'error': 'Progress percent must be between 0 and 100'}), 400

        # Check if course exists and user has access
        course = Course.query.get_or_404(course_id)

        user = User.query.get(user_id)
        user_has_funded_challenge = UserChallenge.query.filter(
            UserChallenge.user_id == user_id,
            UserChallenge.status.in_(['active', 'passed', 'completed'])
        ).first() is not None

        can_access = (
            course.access_level == 'public' or
            (course.access_level == 'funded' and user_has_funded_challenge) or
            (course.access_level == 'premium' and user.role in ['admin', 'superadmin'])
        )

        if not can_access:
            return jsonify({'error': 'Access denied to this course'}), 403

        # Get or create progress record
        progress = UserCourseProgress.query.filter_by(
            user_id=user_id, course_id=course_id
        ).first()

        if not progress:
            progress = UserCourseProgress(
                user_id=user_id,
                course_id=course_id
            )
            db.session.add(progress)

        # Update progress
        progress.progress_percent = progress_percent
        progress.last_watched_position = last_watched_position

        if notes is not None:
            progress.notes = notes

        if quiz_score is not None:
            progress.quiz_score = quiz_score

        # Mark as completed if 100%
        was_completed = progress.is_completed
        if progress_percent >= 100 and not progress.is_completed:
            progress.is_completed = True
            progress.completed_at = db.func.now()

        db.session.commit()

        response_data = progress.to_dict()

        # Add completion badge info if newly completed
        if progress.is_completed and not was_completed:
            response_data['badge_earned'] = True
            response_data['badge_type'] = course.level  # 'beginner', 'intermediate', 'advanced'
            logger.info(f"User {user_id} completed course {course_id}: {course.title}")

        logger.info(f"User {user_id} updated progress for course {course_id}: {progress_percent}%")
        return jsonify({
            'success': True,
            'progress': response_data
        }), 200

    except Exception as e:
        logger.error(f"Error updating progress: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update progress'}), 500

@masterclass_bp.route('/progress/<int:course_id>', methods=['GET'])
@jwt_required()
def get_course_progress(course_id):
    """Get user progress for a specific course"""
    try:
        user_id = get_jwt_identity()

        progress = UserCourseProgress.query.filter_by(
            user_id=user_id, course_id=course_id
        ).first()

        if progress:
            return jsonify(progress.to_dict()), 200
        else:
            return jsonify({
                'user_id': user_id,
                'course_id': course_id,
                'progress_percent': 0,
                'is_completed': False,
                'last_watched_position': 0
            }), 200

    except Exception as e:
        logger.error(f"Error fetching progress for course {course_id}: {e}")
        return jsonify({'error': 'Failed to fetch progress'}), 500

@masterclass_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    """Get user's MasterClass statistics"""
    try:
        user_id = get_jwt_identity()

        # Get user's progress stats
        total_progress = UserCourseProgress.query.filter_by(user_id=user_id).all()

        stats = {
            'total_courses_started': len(total_progress),
            'completed_courses': len([p for p in total_progress if p.is_completed]),
            'total_watch_time': sum(p.last_watched_position for p in total_progress),
            'average_progress': sum(float(p.progress_percent) for p in total_progress) / len(total_progress) if total_progress else 0,
            'badges': {
                'beginner': len([p for p in total_progress if p.is_completed and p.course.level == 'beginner']),
                'intermediate': len([p for p in total_progress if p.is_completed and p.course.level == 'intermediate']),
                'advanced': len([p for p in total_progress if p.is_completed and p.course.level == 'advanced'])
            }
        }

        return jsonify(stats), 200

    except Exception as e:
        logger.error(f"Error fetching user stats: {e}")
        return jsonify({'error': 'Failed to fetch statistics'}), 500