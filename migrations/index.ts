import * as migration_20260823_analytics_events from './20260823_analytics_events';

export const migrations = [
  {
    up: migration_20260823_analytics_events.up,
    down: migration_20260823_analytics_events.down,
    name: '20260823_analytics_events'
  },
];
