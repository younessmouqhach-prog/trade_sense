#!/usr/bin/env python3
"""
Database migration script to add MasterClass tables
Run this script to create the MasterClass database schema
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, CourseCategory, Course

def create_masterclass_tables():
    """Create MasterClass database tables and seed initial data"""
    print("🔧 Creating MasterClass database tables...")

    try:
        app = create_app('development')

        with app.app_context():
            # Create tables
            print("📊 Creating tables...")
            db.create_all()

            # Check if tables were created
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()

            masterclass_tables = ['course_categories', 'courses', 'user_course_progress']
            existing_tables = [t for t in masterclass_tables if t in tables]

            if len(existing_tables) == len(masterclass_tables):
                print("✅ All MasterClass tables created successfully!")
            else:
                print(f"⚠️ Some tables may not have been created. Expected: {masterclass_tables}, Found: {existing_tables}")

            # Seed initial data
            print("🌱 Seeding initial MasterClass data...")

            # Create categories
            categories_data = [
                {'name': 'Débutant', 'description': 'Cours pour les traders débutants', 'order': 1},
                {'name': 'Intermédiaire', 'description': 'Cours pour les traders intermédiaires', 'order': 2},
                {'name': 'Avancé', 'description': 'Cours pour les traders expérimentés', 'order': 3},
            ]

            for cat_data in categories_data:
                if not CourseCategory.query.filter_by(name=cat_data['name']).first():
                    category = CourseCategory(
                        name=cat_data['name'],
                        description=cat_data['description'],
                        order=cat_data['order']
                    )
                    db.session.add(category)
                    print(f"✅ Created category: {cat_data['name']}")

            db.session.commit()

            # Create sample courses
            courses_data = [
                {
                    'title': 'Introduction au Trading',
                    'description': 'Découvrez les bases du trading et les marchés financiers',
                    'category_name': 'Débutant',
                    'level': 'beginner',
                    'duration_minutes': 45,
                    'video_url': 'https://example.com/videos/intro-trading.mp4',
                    'thumbnail_url': 'https://example.com/thumbnails/intro-trading.jpg',
                    'summary': 'Ce cours vous présente les concepts fondamentaux du trading, les différents marchés et les principes de base de l\'analyse technique.',
                    'is_free': True,
                    'access_level': 'public',
                    'order': 1
                },
                {
                    'title': 'Analyse Technique de Base',
                    'description': 'Apprenez à lire les graphiques et utiliser les indicateurs',
                    'category_name': 'Débutant',
                    'level': 'beginner',
                    'duration_minutes': 60,
                    'video_url': 'https://example.com/videos/technical-analysis.mp4',
                    'thumbnail_url': 'https://example.com/thumbnails/technical-analysis.jpg',
                    'summary': 'Maîtrisez les outils d\'analyse technique essentiels pour prendre des décisions de trading éclairées.',
                    'is_free': False,
                    'access_level': 'funded',
                    'order': 2
                },
                {
                    'title': 'Gestion du Risque',
                    'description': 'Stratégies essentielles pour protéger votre capital',
                    'category_name': 'Intermédiaire',
                    'level': 'intermediate',
                    'duration_minutes': 75,
                    'video_url': 'https://example.com/videos/risk-management.mp4',
                    'thumbnail_url': 'https://example.com/thumbnails/risk-management.jpg',
                    'summary': 'Découvrez les meilleures pratiques de gestion du risque pour devenir un trader durable.',
                    'is_free': False,
                    'access_level': 'funded',
                    'order': 1
                },
                {
                    'title': 'Trading Algorithmique',
                    'description': 'Introduction aux stratégies automatisées',
                    'category_name': 'Avancé',
                    'level': 'advanced',
                    'duration_minutes': 90,
                    'video_url': 'https://example.com/videos/algo-trading.mp4',
                    'thumbnail_url': 'https://example.com/thumbnails/algo-trading.jpg',
                    'summary': 'Explorez le monde du trading algorithmique et apprenez à développer vos propres stratégies.',
                    'is_free': False,
                    'access_level': 'premium',
                    'order': 1
                }
            ]

            for course_data in courses_data:
                category = CourseCategory.query.filter_by(name=course_data['category_name']).first()
                if category and not Course.query.filter_by(title=course_data['title']).first():
                    course = Course(
                        title=course_data['title'],
                        description=course_data['description'],
                        category_id=category.id,
                        level=course_data['level'],
                        duration_minutes=course_data['duration_minutes'],
                        video_url=course_data['video_url'],
                        thumbnail_url=course_data['thumbnail_url'],
                        summary=course_data['summary'],
                        is_free=course_data['is_free'],
                        access_level=course_data['access_level'],
                        order=course_data['order']
                    )
                    db.session.add(course)
                    print(f"✅ Created course: {course_data['title']}")

            db.session.commit()

            # Count created data
            categories_count = CourseCategory.query.count()
            courses_count = Course.query.count()

            print("🎉 MasterClass setup complete!")
            print(f"📂 Categories: {categories_count}")
            print(f"📚 Courses: {courses_count}")
            print("\n🚀 Ready to use MasterClass features!")

    except Exception as e:
        print(f"❌ Error creating MasterClass tables: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    create_masterclass_tables()