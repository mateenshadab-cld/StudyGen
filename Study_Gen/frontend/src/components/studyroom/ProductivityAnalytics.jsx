import React, { useState, useEffect } from 'react';
import axiosInstance from '../../services/axiosInstance';
import Heatmap from '../Heatmap';
import styles from './ProductivityAnalytics.module.css';

export default function ProductivityAnalytics({ refreshTrigger = 0 }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    todayMinutes: 0,
    totalHours: 0,
    bestDayName: 'None',
    bestMinutes: 0,
    currentStreak: 0,
    weekDays: [],
    heatmap: [],
  });
  const [hoveredBar, setHoveredBar] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get('/activity/heatmap');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load productivity analytics:', err);
      setError('Could not load productivity data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger]);

  // Transform backend heatmap data format for the reusable Heatmap component
  const heatmapData = (analytics.heatmap || []).map((entry) => ({
    date: entry.date,
    minutesLogged: entry.totalMinutes || 0,
    activityCount: entry.sessionCount || 1,
    intensityLevel: entry.intensityLevel,
  }));

  // Weekdays SVG Bar Chart calculations
  const weekDays = analytics.weekDays || [];
  const maxMinutes = Math.max(...weekDays.map((d) => d.minutes || 0), 60); // min scale 60m
  const chartHeight = 110;
  const barWidth = 24;
  const gap = 16;
  const chartWidth = Math.max(280, weekDays.length * (barWidth + gap) + gap);

  return (
    <div className={styles.container}>
      {/* Metric Cards Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: '#eff6ff', color: '#3b82f6' }}>
            ⏱️
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Today's Focus</span>
            <span className={styles.statValue}>
              {analytics.todayMinutes} <small className={styles.statUnit}>min</small>
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: '#ecfdf5', color: '#10b981' }}>
            📚
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Study</span>
            <span className={styles.statValue}>
              {analytics.totalHours} <small className={styles.statUnit}>hrs</small>
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: '#fff7ed', color: '#f97316' }}>
            🔥
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Current Streak</span>
            <span className={styles.statValue}>
              {analytics.currentStreak} <small className={styles.statUnit}>days</small>
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
            🏆
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Best Day</span>
            <span className={styles.statValueHighlight}>
              {analytics.bestDayName}
              {analytics.bestMinutes > 0 && (
                <span className={styles.bestSub}>({analytics.bestMinutes}m)</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart Card */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <div>
            <h4 className={styles.chartTitle}>7-Day Focus Distribution</h4>
            <span className={styles.chartSubtitle}>Daily minutes logged this week</span>
          </div>
          <span className={styles.chartTarget}>Max: {maxMinutes} min</span>
        </div>

        {loading ? (
          <div className={styles.chartPlaceholder}>
            <div className={styles.spinner}></div>
            <span>Loading activity graph...</span>
          </div>
        ) : error ? (
          <div className={styles.chartError}>
            <span>{error}</span>
            <button onClick={fetchAnalytics} className={styles.retryBtn}>Retry</button>
          </div>
        ) : (
          <div className={styles.svgWrapper}>
            <svg
              className={styles.barChartSvg}
              viewBox={`0 0 ${chartWidth} 170`}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Horizontal grid guide lines */}
              <line
                x1="10"
                y1={25}
                x2={chartWidth - 10}
                y2={25}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <line
                x1="10"
                y1={25 + chartHeight / 2}
                x2={chartWidth - 10}
                y2={25 + chartHeight / 2}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <line
                x1="10"
                y1={25 + chartHeight}
                x2={chartWidth - 10}
                y2={25 + chartHeight}
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              {weekDays.map((d, index) => {
                const x = gap + index * (barWidth + gap);
                const safeMinutes = d.minutes || 0;
                const barH = safeMinutes > 0 ? Math.max(6, Math.round((safeMinutes / maxMinutes) * chartHeight)) : 0;
                const y = 25 + chartHeight - barH;
                const isHovered = hoveredBar === index;
                const isToday = index === weekDays.length - 1;

                return (
                  <g
                    key={d.date || index}
                    onMouseEnter={() => setHoveredBar(index)}
                    onMouseLeave={() => setHoveredBar(null)}
                    className={styles.barGroup}
                  >
                    {/* Background Slot Pill */}
                    <rect
                      x={x}
                      y={25}
                      width={barWidth}
                      height={chartHeight}
                      rx="6"
                      ry="6"
                      fill={isHovered ? '#f1f5f9' : '#f8fafc'}
                      className={styles.barSlot}
                    />

                    {/* Active Bar */}
                    {barH > 0 && (
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barH}
                        rx="6"
                        ry="6"
                        fill={isToday ? 'url(#activeTodayGrad)' : isHovered ? '#2563eb' : '#3b82f6'}
                        className={styles.barRect}
                      />
                    )}

                    {/* Day label */}
                    <text
                      x={x + barWidth / 2}
                      y={25 + chartHeight + 18}
                      textAnchor="middle"
                      className={`${styles.dayLabel} ${isToday ? styles.dayLabelToday : ''}`}
                    >
                      {d.day}
                    </text>

                    {/* Minute label or hover tooltip */}
                    {safeMinutes > 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={Math.max(16, y - 6)}
                        textAnchor="middle"
                        className={`${styles.barValueText} ${isHovered ? styles.barValueTextVisible : ''}`}
                      >
                        {safeMinutes}m
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Gradient definition for today's bar */}
              <defs>
                <linearGradient id="activeTodayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
      </div>

      {/* Consistency Heatmap */}
      <div className={styles.heatmapWrapper}>
        <Heatmap data={heatmapData} days={60} />
      </div>
    </div>
  );
}
