import { init } from '@rematch/core';
import { pivot } from './models/pivot';

const store = init({
  models: {
    pivot
  }
});

export default store;