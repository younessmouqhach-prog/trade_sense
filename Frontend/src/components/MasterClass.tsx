import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, Clock, CheckCircle, Lock, Award, Star, Users, TrendingUp, ChevronRight, PlayCircle, PauseCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface Course {
  id: number;
  title: string;
  description: string;
  category_name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration_minutes: number;
  video_url?: string;
  thumbnail_url?: string;
  summary: string;
  is_free: boolean;
  access_level: 'public' | 'funded' | 'premium';
  can_access: boolean;
  progress?: {
    progress_percent: number;
    is_completed: boolean;
    last_watched_position: number;
  };
}

interface CourseCategory {
  id: number;
  name: string;
  description: string;
}

interface MasterClassResponse {
  courses: Course[];
  categories: CourseCategory[];
  stats: {
    total: number;
    completed: number;
    in_progress: number;
    completion_rate: number;
  };
  user: {
    has_funded_access: boolean;
    role: string;
  };
}

const MasterClass: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [stats, setStats] = useState<MasterClassResponse['stats'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');

  const { user } = useAuth();

  const fetchCourses = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (levelFilter) params.append('level', levelFilter);

      const response = await fetch(`/api/masterclass/courses?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }

      const data: MasterClassResponse = await response.json();

      setCourses(data.courses);
      setCategories(data.categories);
      setStats(data.stats);

    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [categoryFilter, levelFilter]);

  const updateProgress = async (courseId: number, progressData: {
    progress_percent?: number;
    last_watched_position?: number;
  }) => {
    try {
      const response = await fetch('/api/masterclass/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          course_id: courseId,
          ...progressData
        })
      });

      if (response.ok) {
        // Refresh courses to update progress
        fetchCourses();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getAccessIcon = (course: Course) => {
    if (!course.can_access) {
      return <Lock className="w-4 h-4 text-gray-400" />;
    }
    if (course.progress?.is_completed) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    if (course.progress && course.progress.progress_percent > 0) {
      return <PlayCircle className="w-4 h-4 text-cyan-500" />;
    }
    return <Play className="w-4 h-4 text-cyan-500" />;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const filteredCourses = courses.filter(course => {
    if (categoryFilter && course.category_name !== categoryFilter) return false;
    if (levelFilter && course.level !== levelFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 pt-24 md:pt-28">
      <div className="p-4 relative overflow-hidden">
        {/* Ambient Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-r from-cyan-400/20 to-blue-500/20 dark:from-cyan-600/10 dark:to-blue-700/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-to-r from-emerald-400/15 to-teal-500/15 dark:from-emerald-600/8 dark:to-teal-700/8 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-5 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-center gap-3">
              <BookOpen className="w-10 h-10 text-cyan-500" />
              MasterClass
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Professional trading education to accelerate your success
            </p>
          </motion.div>

          {/* Stats Overview */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <div className="bg-white dark:bg-[#0B1121]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-center">
                <BookOpen className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Courses</div>
              </div>
              <div className="bg-white dark:bg-[#0B1121]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completed}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Completed</div>
              </div>
              <div className="bg-white dark:bg-[#0B1121]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-center">
                <PlayCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.in_progress}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">In Progress</div>
              </div>
              <div className="bg-white dark:bg-[#0B1121]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-center">
                <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completion_rate}%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</div>
              </div>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 bg-white dark:bg-[#0B1121]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Level
                </label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {loading ? (
              // Skeleton Loading
              Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-[#0B1121]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-6"
                >
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              filteredCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-[#0B1121]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => course.can_access && setSelectedCourse(course)}
                >
                  {/* Thumbnail */}
                  {course.thumbnail_url && (
                    <div className="relative mb-4">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                        {getAccessIcon(course)}
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium">
                      {course.category_name}
                    </span>
                    {!course.can_access && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-xs font-medium">
                        {course.access_level === 'funded' ? 'Funded Access' : 'Premium'}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {course.progress && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>{course.progress.progress_percent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress.progress_percent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(course.duration_minutes)}</span>
                    </div>
                    {course.progress?.is_completed && (
                      <div className="flex items-center gap-1 text-green-500">
                        <Award className="w-4 h-4" />
                        <span>Completed</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Course Detail Modal */}
          {selectedCourse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedCourse(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-[#0B1121] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {selectedCourse.title}
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        {selectedCourse.category_name} • {selectedCourse.level}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                  {/* Video Player */}
                  {selectedCourse.video_url && (
                    <div className="mb-6">
                      <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                        <video
                          src={selectedCourse.video_url}
                          controls
                          className="w-full h-full"
                          poster={selectedCourse.thumbnail_url}
                          onTimeUpdate={(e) => {
                            const currentTime = Math.floor(e.currentTarget.currentTime);
                            if (selectedCourse.progress && currentTime !== selectedCourse.progress.last_watched_position) {
                              updateProgress(selectedCourse.id, {
                                last_watched_position: currentTime
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  {selectedCourse.progress && (
                    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900 dark:text-white">Your Progress</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {selectedCourse.progress.progress_percent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                        <div
                          className="bg-cyan-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${selectedCourse.progress.progress_percent}%` }}
                        ></div>
                      </div>
                      {selectedCourse.progress.is_completed && (
                        <div className="flex items-center gap-2 mt-2 text-green-600 dark:text-green-400">
                          <Award className="w-4 h-4" />
                          <span className="text-sm font-medium">Course Completed!</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      About This Course
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {selectedCourse.summary}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => updateProgress(selectedCourse.id, { progress_percent: 100 })}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      Mark as Complete
                    </button>
                    <button
                      onClick={() => setSelectedCourse(null)}
                      className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasterClass;