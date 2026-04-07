// Students master list - shows all students across all classes
// Includes filtering by class, year level, and status

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { useStudents } from '../hooks/useStudents';

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: allStudents, isLoading } = useStudents();

  // Flatten students from enrollments to create master list with class info
  const students = allStudents?.flatMap(student =>
    student.enrollments.map(enrollment => ({
      student_id: student.student_id,
      full_name: student.full_name,
      email: student.email,
      class_name: enrollment.class_name,
      class_id: enrollment.class_id,
      enrolled_at: enrollment.enrolled_at,
      // Note: Progress and status will be 0/not_started until reasoning_traces exist
      progress: 0,
      status: 'not_started' as const,
      last_active: 'Never'
    }))
  ) || [];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.student_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'all' || student.class_id === classFilter;
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'text-mastery bg-mastery/10';
      case 'active':
        return 'text-misconception bg-misconception/10';
      case 'flagged':
        return 'text-critical bg-critical/10';
      default:
        return 'text-tertiary bg-warm-grey/20';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-mastery';
    if (progress >= 50) return 'bg-misconception';
    return 'bg-critical';
  };

  return (
    <div className="flex">
      <Sidebar />

      <main className="ml-64 min-h-screen bg-parchment p-10 flex-1">
        <TopBar />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">Students</h1>
          <p className="text-[14px] text-tertiary">
            Master list of all students across your classes
          </p>
        </div>

        {/* Filters */}
        <div className="bg-warm-white rounded-xl border border-warm-grey p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-2 block">
                Search
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tertiary/50 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-parchment border border-warm-grey rounded-lg text-[13px] text-primary focus:outline-none focus:border-terracotta transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-2 block">
                Class
              </label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-4 py-2 bg-parchment border border-warm-grey rounded-lg text-[13px] text-primary focus:outline-none focus:border-terracotta transition-colors"
              >
                <option value="all">All Classes</option>
                <option value="ECON101">Economics</option>
                <option value="ENG101">English Standard</option>
                <option value="SOFT101">Software Development</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-2 block">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-parchment border border-warm-grey rounded-lg text-[13px] text-primary focus:outline-none focus:border-terracotta transition-colors"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="complete">Complete</option>
                <option value="flagged">Flagged</option>
                <option value="not_started">Not Started</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-warm-white rounded-xl border border-warm-grey overflow-hidden">
          <table className="w-full">
            <thead className="bg-parchment border-b border-warm-grey">
              <tr>
                <th className="text-left px-6 py-4 text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                  Student
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                  Class
                </th>
                <th className="text-left px-6 py-4 text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                  Progress
                </th>
                <th className="text-center px-6 py-4 text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                  Status
                </th>
                <th className="text-center px-6 py-4 text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                  Last Active
                </th>
                <th className="text-center px-6 py-4 text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <div className="space-y-4">
                      <div className="h-12 bg-warm-grey rounded animate-pulse"></div>
                      <div className="h-12 bg-warm-grey rounded animate-pulse"></div>
                      <div className="h-12 bg-warm-grey rounded animate-pulse"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-tertiary/30 mb-4 block">
                      search_off
                    </span>
                    <p className="text-[13px] text-tertiary">No students found matching your filters</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr
                    key={`${student.student_id}-${student.class_id}`}
                    className="border-b border-warm-grey hover:bg-parchment/50 transition-all duration-300 animate-fade-in"
                    style={{
                      animationDelay: `${index * 30}ms`,
                      opacity: 0,
                      animation: `fadeIn 0.3s ease-out ${index * 30}ms forwards`
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta font-bold text-[12px]">
                          {student.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-primary">{student.full_name}</p>
                          <p className="text-[10px] text-tertiary/70">{student.student_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/class/${student.class_id}`}>
                        <span className="text-[12px] text-wheat-gold hover:text-terracotta font-semibold transition-colors">
                          {student.class_name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[120px]">
                          <div className="w-full h-2 bg-warm-grey/30 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getProgressColor(student.progress)} transition-all duration-500`}
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-[12px] font-bold text-primary min-w-[45px]">
                          {student.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest ${getStatusColor(student.status)}`}>
                        {student.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-[11px] text-tertiary/70">{student.last_active}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-[10px] font-extrabold text-terracotta hover:text-terracotta/80 transition-all uppercase tracking-widest">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
