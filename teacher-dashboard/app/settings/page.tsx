// Settings page - system configuration and professor profile
// Firebase integration, API keys, and preferences

'use client';

import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'preferences' | 'classes'>('profile');

  return (
    <div className="flex">
      <Sidebar />

      <main className="ml-64 min-h-screen bg-parchment p-10 flex-1">
        <TopBar />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">Settings</h1>
          <p className="text-[14px] text-tertiary">
            Manage your profile, API configuration, and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-warm-grey">
          {[
            { id: 'profile', label: 'Profile', icon: 'person' },
            { id: 'api', label: 'API Keys', icon: 'key' },
            { id: 'preferences', label: 'Preferences', icon: 'tune' },
            { id: 'classes', label: 'Class Management', icon: 'school' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-[12px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'text-terracotta border-terracotta'
                  : 'text-tertiary border-transparent hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest mb-6">
                Professor Profile
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta font-bold text-2xl">
                    PJ
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-primary">Professor Jordan</p>
                    <p className="text-[12px] text-tertiary">jordan@university.edu</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-2 block">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Professor Jordan"
                      className="w-full px-4 py-2 bg-parchment border border-warm-grey rounded-lg text-[13px] text-primary focus:outline-none focus:border-terracotta transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-2 block">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue="jordan@university.edu"
                      className="w-full px-4 py-2 bg-parchment border border-warm-grey rounded-lg text-[13px] text-primary focus:outline-none focus:border-terracotta transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-2 block">
                      Institution
                    </label>
                    <input
                      type="text"
                      defaultValue="University of Sydney"
                      className="w-full px-4 py-2 bg-parchment border border-warm-grey rounded-lg text-[13px] text-primary focus:outline-none focus:border-terracotta transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-2 block">
                      Department
                    </label>
                    <input
                      type="text"
                      defaultValue="Economics & Business"
                      className="w-full px-4 py-2 bg-parchment border border-warm-grey rounded-lg text-[13px] text-primary focus:outline-none focus:border-terracotta transition-colors"
                    />
                  </div>
                </div>

                <button className="px-6 py-2.5 bg-terracotta text-parchment rounded-lg text-[11px] font-extrabold uppercase tracking-widest hover:bg-terracotta/90 transition-all">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest mb-6">
                API Configuration
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                      Firebase Project ID
                    </label>
                    <span className="text-[9px] font-extrabold text-mastery bg-mastery/10 px-2 py-1 rounded-full uppercase tracking-widest">
                      Connected
                    </span>
                  </div>
                  <input
                    type="text"
                    value="cervantes-caebc"
                    readOnly
                    className="w-full px-4 py-2 bg-parchment/50 border border-warm-grey rounded-lg text-[13px] text-primary/70"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                      Gemini API Key
                    </label>
                    <span className="text-[9px] font-extrabold text-mastery bg-mastery/10 px-2 py-1 rounded-full uppercase tracking-widest">
                      Active
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      value="AIzaSy*********************5dNjI"
                      readOnly
                      className="w-full px-4 py-2 bg-parchment/50 border border-warm-grey rounded-lg text-[13px] text-primary/70"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest">
                      CurricuLLM API Key
                    </label>
                    <span className="text-[9px] font-extrabold text-misconception bg-misconception/10 px-2 py-1 rounded-full uppercase tracking-widest">
                      Not Set
                    </span>
                  </div>
                  <input
                    type="password"
                    placeholder="Enter CurricuLLM API key..."
                    className="w-full px-4 py-2 bg-parchment border border-warm-grey rounded-lg text-[13px] text-primary focus:outline-none focus:border-terracotta transition-colors"
                  />
                </div>

                <div className="bg-wheat-gold/10 border border-wheat-gold/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-wheat-gold text-xl">
                      info
                    </span>
                    <div>
                      <p className="text-[12px] font-bold text-primary mb-1">API Usage</p>
                      <p className="text-[11px] text-tertiary/70 leading-relaxed">
                        Gemini: 247 requests this month • CurricuLLM: Not configured
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest mb-6">
                Assessment Preferences
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-primary mb-1">Auto-publish Arcs</p>
                    <p className="text-[11px] text-tertiary/70">Automatically publish arcs after generation</p>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-full h-full bg-warm-grey rounded-full peer-checked:bg-terracotta transition-all cursor-pointer"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-parchment rounded-full transition-all peer-checked:translate-x-6"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-primary mb-1">Flag Critical Gaps</p>
                    <p className="text-[11px] text-tertiary/70">Automatically flag students with critical misconceptions</p>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-full h-full bg-warm-grey rounded-full peer-checked:bg-terracotta transition-all cursor-pointer"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-parchment rounded-full transition-all peer-checked:translate-x-6"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-primary mb-1">Email Notifications</p>
                    <p className="text-[11px] text-tertiary/70">Receive updates when students complete arcs</p>
                  </div>
                  <label className="relative inline-block w-12 h-6">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-full h-full bg-warm-grey rounded-full peer-checked:bg-terracotta transition-all cursor-pointer"></div>
                    <div className="absolute left-1 top-1 w-4 h-4 bg-parchment rounded-full transition-all peer-checked:translate-x-6"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
              <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest mb-6">
                Default Arc Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-2 block">
                    Default Scene Count
                  </label>
                  <select className="w-full px-4 py-2 bg-parchment border border-warm-grey rounded-lg text-[13px] text-primary focus:outline-none focus:border-terracotta transition-colors">
                    <option value="3">3 Scenes (Short)</option>
                    <option value="5" selected>5 Scenes (Standard)</option>
                    <option value="7">7 Scenes (Extended)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-tertiary uppercase tracking-widest mb-2 block">
                    Generation Temperature
                  </label>
                  <select className="w-full px-4 py-2 bg-parchment border border-warm-grey rounded-lg text-[13px] text-primary focus:outline-none focus:border-terracotta transition-colors">
                    <option value="0.5">0.5 (Conservative)</option>
                    <option value="0.7" selected>0.7 (Balanced)</option>
                    <option value="0.9">0.9 (Creative)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Class Management Tab */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="bg-warm-white rounded-xl border border-warm-grey p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-extrabold text-tertiary uppercase tracking-widest">
                  Active Classes
                </h3>
                <button className="text-[10px] font-extrabold text-terracotta hover:text-terracotta/80 transition-all uppercase tracking-widest flex items-center gap-1">
                  Add Class
                  <span className="material-symbols-outlined text-xs">add</span>
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Economics', code: 'ECON101', students: 10 },
                  { name: 'English Standard', code: 'ENG101', students: 8 },
                  { name: 'Software Development', code: 'SOFT101', students: 12 }
                ].map((cls) => (
                  <div key={cls.code} className="flex items-center justify-between p-4 bg-parchment/50 rounded-lg border border-warm-grey hover:border-terracotta/30 transition-all">
                    <div>
                      <p className="text-[13px] font-bold text-primary">{cls.name}</p>
                      <p className="text-[11px] text-tertiary/70">{cls.code} • {cls.students} students</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-[10px] font-extrabold text-wheat-gold hover:text-wheat-gold/80 transition-all uppercase tracking-widest">
                        Edit
                      </button>
                      <button className="text-[10px] font-extrabold text-critical hover:text-critical/80 transition-all uppercase tracking-widest">
                        Archive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
