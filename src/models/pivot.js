import { createModel } from '@rematch/core';

export const pivot = createModel()({
  state: {
    rawData: [],
    headers: [],
    numericHeaders: [],
    pivotConfig: {
      rowFields: [],
      colFields: [],
      valFields: [],
      aggregateFuncs: {},
    }
  },
  reducers: {
    setRawData(state, payload) {
      return {
        ...state,
        rawData: payload
      };
    },
    setHeaders(state, payload) {
      return {
        ...state,
        headers: payload
      };
    },
    setNumericHeaders(state, payload) {
      return {
        ...state,
        numericHeaders: payload
      };
    },
    setPivotConfig(state, payload) {
      return {
        ...state,
        pivotConfig: payload
      };
    }
  },
  effects: (dispatch) => ({
    updatePivotConfig(payload, rootState) {
      dispatch.pivot.setPivotConfig(payload);
    },
    processHeaders(_, rootState) {
      const { rawData, headers } = rootState.pivot;
      
      if (rawData.length > 0 && headers.length > 0) {
        const isDate = (value) => {
          const parsed = Date.parse(value);
          return !isNaN(parsed) && isNaN(Number(value));
        };
        
        const numerics = headers.filter(header =>
          rawData.some(row => {
            const val = row[header];
            const num = parseFloat(val);
            return (
              val !== '' &&
              !isNaN(num) &&
              !isDate(val)
            );
          })
        );
        
        dispatch.pivot.setNumericHeaders(numerics);
      }
    }
  })
});