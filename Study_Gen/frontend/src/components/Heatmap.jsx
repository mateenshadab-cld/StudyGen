import React from 'react';
import styles from './Heatmap.module.css';

const Heatmap = ({ data = [], days = 180 }) => {
  // Generate date grid for the last `days` days
  const today = new Date();
  const activityMap = new Map();

  if (Array.isArray(data)) {
    data.forEach((item) => {
      const dateStr = item.loggedDate || item.date;
      if (dateStr) {
        activityMap.set(dateStr, {
          activities: item.activityCount || item.activities || (item.minutesLogged ? 1 : 0),
          minutes: item.minutesLogged || item.minutes || 0,
          intensity: item.intensityLevel !== undefined ? item.intensityLevel : 0,
        });
      }
    });
  }

  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const entry = activityMap.get(dateStr) || { activities: 0, minutes: 0, intensity: 0 };
    
    // Calculate level 0..4
    let level = entry.intensity;
    if (!level) {
      if (entry.minutes >= 60) level = 4;
      else if (entry.minutes >= 35) level = 3;
      else if (entry.minutes >= 15) level = 2;
      else if (entry.minutes > 0 || entry.activities > 0) level = 1;
      else level = 0;
    }

    cells.push({
      date: dateStr,
      level: Math.min(4, Math.max(0, level)),
      activities: entry.activities,
      minutes: entry.minutes,
    });
  }

  return (
    <div className={styles.heatmapCard}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <span className={styles.icon}>🔥</span>
          <h3 className={styles.title}>Consistency & Study Activity</h3>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendLabel}>Less</span>
          <span className={`${styles.square} ${styles.level0}`} />
          <span className={`${styles.square} ${styles.level1}`} />
          <span className={`${styles.square} ${styles.level2}`} />
          <span className={`${styles.square} ${styles.level3}`} />
          <span className={`${styles.square} ${styles.level4}`} />
          <span className={styles.legendLabel}>More</span>
        </div>
      </div>

      <div className={styles.gridContainer}>
        {cells.map((cell, idx) => (
          <div
            key={idx}
            className={`${styles.square} ${styles[`level${cell.level}`]}`}
            title={`${cell.date}: ${cell.activities} activities, ${cell.minutes} min`}
          />
        ))}
      </div>
    </div>
  );
};

export default Heatmap;
