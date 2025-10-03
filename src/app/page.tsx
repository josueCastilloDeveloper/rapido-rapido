'use client';

import React, { useState } from 'react';

interface Activity {
  id: string;
  name: string;
  emoji: string;
}

interface Routine {
  id: string;
  name: string;
  activities: string[];
  emoji: string;
}

interface ActiveRoutine {
  routineId: string;
  startTime: number;
  currentActivityIndex: number;
  completedActivities: string[];
  stageTimes: { [activityId: string]: number };
}

interface CompletedRoutine {
  id: string;
  routineId: string;
  completedAt: number;
  totalTime: number;
  stageTimes: { [activityId: string]: number };
}

type ViewMode = 'home' | 'stats';

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityEmoji, setNewActivityEmoji] = useState('⏰');
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineEmoji, setNewRoutineEmoji] = useState('🔄');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<ActiveRoutine | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [completedRoutines, setCompletedRoutines] = useState<CompletedRoutine[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedRoutineForStats, setSelectedRoutineForStats] = useState<string>('');

  const handleCreateActivity = async () => {
    if (newActivityName.trim()) {
      try {
        const response = await fetch('/api/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newActivityName.trim(),
            emoji: newActivityEmoji,
          }),
        });
        
        if (response.ok) {
          const newActivity = await response.json();
          setActivities([...activities, newActivity]);
          setNewActivityName('');
          setNewActivityEmoji('⏰');
          setShowActivityForm(false);
        }
      } catch (error) {
        console.error('Error creating activity:', error);
      }
    }
  };

  const handleCreateRoutine = async () => {
    if (newRoutineName.trim() && selectedActivities.length > 0) {
      try {
        const response = await fetch('/api/routines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newRoutineName.trim(),
            activities: selectedActivities,
            emoji: newRoutineEmoji,
          }),
        });
        
        if (response.ok) {
          const newRoutine = await response.json();
          setRoutines([...routines, newRoutine]);
          setNewRoutineName('');
          setNewRoutineEmoji('🔄');
          setSelectedActivities([]);
          setShowRoutineForm(false);
        }
      } catch (error) {
        console.error('Error creating routine:', error);
      }
    }
  };

  const toggleActivitySelection = (activityId: string) => {
    setSelectedActivities(prev => 
      prev.includes(activityId) 
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const startRoutine = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (routine) {
      setActiveRoutine({
        routineId,
        startTime: Date.now(),
        currentActivityIndex: 0,
        completedActivities: [],
        stageTimes: {}
      });
      setCurrentTime(0);
    }
  };

  const completeCurrentActivity = async () => {
    if (!activeRoutine) return;
    
    const routine = routines.find(r => r.id === activeRoutine.routineId);
    if (!routine) return;

    const currentActivityId = routine.activities[activeRoutine.currentActivityIndex];
    const activityStartTime = activeRoutine.stageTimes[currentActivityId] || activeRoutine.startTime;
    const activityDuration = Date.now() - activityStartTime;

    const newActiveRoutine = {
      ...activeRoutine,
      completedActivities: [...activeRoutine.completedActivities, currentActivityId],
      currentActivityIndex: activeRoutine.currentActivityIndex + 1,
      stageTimes: {
        ...activeRoutine.stageTimes,
        [currentActivityId]: activityDuration
      }
    };

    setActiveRoutine(newActiveRoutine);

    // Si es la última actividad, completar el recorrido
    if (newActiveRoutine.currentActivityIndex >= routine.activities.length) {
      // Guardar el recorrido completado en el historial
      const completedRoutine: CompletedRoutine = {
        id: Date.now().toString(),
        routineId: routine.id,
        completedAt: Date.now(),
        totalTime: Date.now() - activeRoutine.startTime,
        stageTimes: newActiveRoutine.stageTimes
      };
      
      // Guardar en la base de datos
      try {
        await fetch('/api/completed-routines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(completedRoutine),
        });
      } catch (error) {
        console.error('Error saving completed routine:', error);
      }
      
      setCompletedRoutines(prev => [...prev, completedRoutine]);
      
      setTimeout(() => {
        setActiveRoutine(null);
        setCurrentTime(0);
      }, 2000);
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeShort = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getRoutineStats = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return null;

    const completedRuns = completedRoutines.filter(cr => cr.routineId === routineId);
    if (completedRuns.length === 0) return null;

    const stats = {
      totalRuns: completedRuns.length,
      averageTotalTime: completedRuns.reduce((sum, run) => sum + run.totalTime, 0) / completedRuns.length,
      bestTotalTime: Math.min(...completedRuns.map(run => run.totalTime)),
      worstTotalTime: Math.max(...completedRuns.map(run => run.totalTime)),
      activityStats: routine.activities.map(activityId => {
        const activity = activities.find(a => a.id === activityId);
        const times = completedRuns.map(run => run.stageTimes[activityId] || 0);
        return {
          activityId,
          activityName: activity?.name || 'Actividad desconocida',
          activityEmoji: activity?.emoji || '❓',
          times,
          averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
          bestTime: Math.min(...times),
          worstTime: Math.max(...times)
        };
      })
    };

    return stats;
  };

  // Load data on component mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Load activities
        const activitiesResponse = await fetch('/api/activities');
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          setActivities(activitiesData);
        }

        // Load routines
        const routinesResponse = await fetch('/api/routines');
        if (routinesResponse.ok) {
          const routinesData = await routinesResponse.json();
          setRoutines(routinesData);
        }

        // Load completed routines
        const completedRoutinesResponse = await fetch('/api/completed-routines');
        if (completedRoutinesResponse.ok) {
          const completedRoutinesData = await completedRoutinesResponse.json();
          setCompletedRoutines(completedRoutinesData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeRoutine) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - activeRoutine.startTime);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeRoutine]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 p-4">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl mb-3">⏱️</h1>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Rápido Rápido
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            ¡Mide el tiempo de tus actividades diarias!
          </p>
          
          {/* Navigation */}
          <div className="flex bg-white rounded-2xl p-1 shadow-lg">
            <button
              onClick={() => setCurrentView('home')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                currentView === 'home' 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-600 text-white shadow-lg' 
                  : 'text-gray-600 active:bg-gray-100'
              }`}
            >
              🏠 Inicio
            </button>
            <button
              onClick={() => setCurrentView('stats')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                currentView === 'stats' 
                  ? 'bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-600 active:bg-gray-100'
              }`}
            >
              📊 Estadísticas
            </button>
          </div>
        </div>

        {/* Home View */}
        {currentView === 'home' && (
          <>
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-6">
              <button
                onClick={() => setShowActivityForm(true)}
                className="bg-gradient-to-r from-pink-400 to-pink-600 active:from-pink-500 active:to-pink-700 text-white font-bold py-5 px-6 rounded-2xl text-lg shadow-lg active:scale-95 transition-all duration-150 flex items-center justify-center gap-3 touch-manipulation"
              >
                <span className="text-2xl">➕</span>
                Crear Actividad
              </button>
              
              <button
                onClick={() => setShowRoutineForm(true)}
                className="bg-gradient-to-r from-blue-400 to-blue-600 active:from-blue-500 active:to-blue-700 text-white font-bold py-5 px-6 rounded-2xl text-lg shadow-lg active:scale-95 transition-all duration-150 flex items-center justify-center gap-3 touch-manipulation"
              >
                <span className="text-2xl">🔄</span>
                Crear Recorrido
              </button>
            </div>

        {/* Activity Form Modal */}
        {showActivityForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <h2 className="text-xl font-bold text-gray-800 mb-5 text-center">
                🆕 Nueva Actividad
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la actividad
                  </label>
                  <input
                    type="text"
                    value={newActivityName}
                    onChange={(e) => setNewActivityName(e.target.value)}
                    placeholder="Ej: Lavarme los dientes"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none text-lg touch-manipulation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={newActivityEmoji}
                    onChange={(e) => setNewActivityEmoji(e.target.value)}
                    placeholder="🦷"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:outline-none text-2xl text-center touch-manipulation"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowActivityForm(false)}
                  className="flex-1 py-4 px-4 bg-gray-200 text-gray-700 rounded-xl font-medium active:bg-gray-300 transition-colors touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateActivity}
                  className="flex-1 py-4 px-4 bg-gradient-to-r from-pink-400 to-pink-600 text-white rounded-xl font-medium active:from-pink-500 active:to-pink-700 transition-all touch-manipulation"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Routine Form Modal */}
        {showRoutineForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[85vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-5 text-center">
                🔄 Nuevo Recorrido
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del recorrido
                  </label>
                  <input
                    type="text"
                    value={newRoutineName}
                    onChange={(e) => setNewRoutineName(e.target.value)}
                    placeholder="Ej: Rutina matutina"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none text-lg touch-manipulation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={newRoutineEmoji}
                    onChange={(e) => setNewRoutineEmoji(e.target.value)}
                    placeholder="🌅"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none text-2xl text-center touch-manipulation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona actividades
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {activities.map((activity) => (
                      <label key={activity.id} className="flex items-center p-4 bg-gray-50 rounded-xl active:bg-gray-100 cursor-pointer touch-manipulation">
                        <input
                          type="checkbox"
                          checked={selectedActivities.includes(activity.id)}
                          onChange={() => toggleActivitySelection(activity.id)}
                          className="mr-3 w-5 h-5 text-blue-600 touch-manipulation"
                        />
                        <span className="text-xl mr-3">{activity.emoji}</span>
                        <span className="text-gray-700 text-sm">{activity.name}</span>
                      </label>
                    ))}
                    {activities.length === 0 && (
                      <p className="text-gray-500 text-center py-4 text-sm">
                        Primero crea algunas actividades
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowRoutineForm(false)}
                  className="flex-1 py-4 px-4 bg-gray-200 text-gray-700 rounded-xl font-medium active:bg-gray-300 transition-colors touch-manipulation"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateRoutine}
                  disabled={selectedActivities.length === 0}
                  className="flex-1 py-4 px-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-xl font-medium active:from-blue-500 active:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Activities List */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
            🎯 Mis Actividades ({activities.length})
          </h2>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-2xl p-5 shadow-lg active:shadow-xl transition-shadow touch-manipulation">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">{activity.emoji}</div>
                  <h3 className="text-lg font-semibold text-gray-800">{activity.name}</h3>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">📝</div>
                <p className="text-gray-500 text-lg">¡Crea tu primera actividad!</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Routine Timer */}
        {activeRoutine && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              {(() => {
                const routine = routines.find(r => r.id === activeRoutine.routineId);
                if (!routine) return null;
                
                const currentActivityId = routine.activities[activeRoutine.currentActivityIndex];
                const currentActivity = activities.find(a => a.id === currentActivityId);
                const isCompleted = activeRoutine.currentActivityIndex >= routine.activities.length;
                
                if (isCompleted) {
                  return (
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎉</div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        ¡Recorrido Completado!
                      </h2>
                      <div className="text-3xl font-bold text-green-600 mb-4">
                        {formatTime(currentTime)}
                      </div>
                      <div className="space-y-2 mb-6">
                        {routine.activities.map((activityId) => {
                          const activity = activities.find(a => a.id === activityId);
                          const duration = activeRoutine.stageTimes[activityId];
                          return activity ? (
                            <div key={activityId} className="flex items-center justify-between bg-green-50 rounded-xl p-3">
                              <div className="flex items-center">
                                <span className="text-xl mr-3">{activity.emoji}</span>
                                <span className="text-sm font-medium text-gray-700">{activity.name}</span>
                              </div>
                              <span className="text-sm font-bold text-green-600">
                                {formatTime(duration)}
                              </span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <>
                    <div className="text-center mb-6">
                      <div className="text-4xl mb-3">{routine.emoji}</div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2">{routine.name}</h2>
                      <div className="text-3xl font-bold text-blue-600 mb-4">
                        {formatTime(currentTime)}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Progreso</span>
                        <span className="text-sm font-bold text-blue-600">
                          {activeRoutine.currentActivityIndex + 1} / {routine.activities.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${((activeRoutine.currentActivityIndex + 1) / routine.activities.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                        🎯 Actividad Actual
                      </h3>
                      {currentActivity && (
                        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-4 text-center">
                          <div className="text-4xl mb-2">{currentActivity.emoji}</div>
                          <h4 className="text-lg font-bold text-gray-800">{currentActivity.name}</h4>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={completeCurrentActivity}
                      className="w-full py-4 px-6 bg-gradient-to-r from-green-400 to-green-600 text-white font-bold rounded-2xl text-lg shadow-lg active:scale-95 transition-all duration-150 touch-manipulation"
                    >
                      ✅ Completar Actividad
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Routines List */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
            🔄 Mis Recorridos ({routines.length})
          </h2>
          <div className="space-y-3">
            {routines.map((routine) => (
              <div key={routine.id} className="bg-white rounded-2xl p-5 shadow-lg active:shadow-xl transition-shadow touch-manipulation">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4">{routine.emoji}</div>
                    <h3 className="text-lg font-semibold text-gray-800">{routine.name}</h3>
                  </div>
                  <button
                    onClick={() => startRoutine(routine.id)}
                    disabled={activeRoutine !== null}
                    className="bg-gradient-to-r from-green-400 to-green-600 text-white font-bold py-2 px-4 rounded-xl text-sm shadow-lg active:scale-95 transition-all duration-150 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ▶️ Iniciar
                  </button>
                </div>
                <div className="space-y-2 ml-12">
                  {routine.activities.map((activityId) => {
                    const activity = activities.find(a => a.id === activityId);
                    return activity ? (
                      <div key={activityId} className="flex items-center text-sm text-gray-600">
                        <span className="mr-2 text-lg">{activity.emoji}</span>
                        <span>{activity.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
            {routines.length === 0 && (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🔄</div>
                <p className="text-gray-500 text-lg">¡Crea tu primer recorrido!</p>
              </div>
            )}
          </div>
        </div>
          </>
        )}

        {/* Stats View */}
        {currentView === 'stats' && (
          <div className="space-y-6">
            {/* Routine Selector */}
            <div className="bg-white rounded-2xl p-5 shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                📊 Selecciona un Recorrido
              </h2>
              <div className="space-y-3">
                {routines.map((routine) => {
                  const stats = getRoutineStats(routine.id);
                  return (
                    <button
                      key={routine.id}
                      onClick={() => setSelectedRoutineForStats(routine.id)}
                      className={`w-full p-4 rounded-xl text-left transition-all touch-manipulation ${
                        selectedRoutineForStats === routine.id
                          ? 'bg-gradient-to-r from-purple-100 to-purple-200 border-2 border-purple-400'
                          : 'bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{routine.emoji}</span>
                          <div>
                            <h3 className="font-semibold text-gray-800">{routine.name}</h3>
                            <p className="text-sm text-gray-600">
                              {stats ? `${stats.totalRuns} ejecuciones` : 'Sin datos'}
                            </p>
                          </div>
                        </div>
                        {stats && (
                          <div className="text-right">
                            <div className="text-sm font-bold text-purple-600">
                              {formatTimeShort(stats.averageTotalTime)}
                            </div>
                            <div className="text-xs text-gray-500">promedio</div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
                {routines.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-3">📊</div>
                    <p className="text-gray-500 text-lg">¡Crea recorridos para ver estadísticas!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics Display */}
            {selectedRoutineForStats && (() => {
              const routine = routines.find(r => r.id === selectedRoutineForStats);
              const stats = getRoutineStats(selectedRoutineForStats);
              
              if (!routine || !stats) {
                return (
                  <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
                    <div className="text-5xl mb-4">📈</div>
                    <p className="text-gray-500 text-lg">No hay datos suficientes para mostrar estadísticas</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Overall Stats */}
                  <div className="bg-white rounded-2xl p-5 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                      🏆 Resumen General
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.totalRuns}</div>
                        <div className="text-sm text-gray-600">Ejecuciones</div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{formatTimeShort(stats.averageTotalTime)}</div>
                        <div className="text-sm text-gray-600">Promedio</div>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{formatTimeShort(stats.bestTotalTime)}</div>
                        <div className="text-sm text-gray-600">Mejor</div>
                      </div>
                      <div className="bg-gradient-to-r from-red-100 to-red-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{formatTimeShort(stats.worstTotalTime)}</div>
                        <div className="text-sm text-gray-600">Peor</div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="bg-white rounded-2xl p-5 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                      📈 Tiempos por Actividad
                    </h3>
                    <div className="space-y-4">
                      {stats.activityStats.map((activityStat) => (
                        <div key={activityStat.activityId} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center mb-3">
                            <span className="text-2xl mr-3">{activityStat.activityEmoji}</span>
                            <h4 className="font-semibold text-gray-800">{activityStat.activityName}</h4>
                          </div>
                          
                          {/* Simple Bar Chart */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Mejor: {formatTimeShort(activityStat.bestTime)}</span>
                              <span>Promedio: {formatTimeShort(activityStat.averageTime)}</span>
                              <span>Peor: {formatTimeShort(activityStat.worstTime)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${Math.min(100, (activityStat.averageTime / Math.max(...stats.activityStats.map(a => a.averageTime))) * 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Time History */}
                          <div className="flex gap-1 justify-center">
                            {activityStat.times.slice(-10).map((time, timeIndex) => (
                              <div
                                key={timeIndex}
                                className="bg-purple-400 rounded-sm transition-all duration-300"
                                style={{
                                  width: '8px',
                                  height: `${Math.max(8, (time / Math.max(...activityStat.times)) * 40)}px`
                                }}
                                title={`Ejecución ${timeIndex + 1}: ${formatTimeShort(time)}`}
                              ></div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress Over Time */}
                  <div className="bg-white rounded-2xl p-5 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                      📊 Progreso Temporal
                    </h3>
                    <div className="space-y-3">
                      {(() => {
                        const completedRuns = completedRoutines.filter(cr => cr.routineId === selectedRoutineForStats);
                        return completedRuns.slice(-5).map((run, index) => (
                          <div key={run.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center">
                              <span className="text-lg mr-3">🏃</span>
                              <span className="text-sm text-gray-600">Ejecución {completedRuns.length - index}</span>
                            </div>
                            <div className="text-lg font-bold text-purple-600">
                              {formatTimeShort(run.totalTime)}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
