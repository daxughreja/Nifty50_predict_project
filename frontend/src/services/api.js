import axios from 'axios';

// 1. Resolve API Base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
console.log("Axios Client Base URL (API_BASE_URL):", API_BASE_URL);

// 2. Create Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15s timeout
});

// 3. Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const fullUrl = (config.baseURL || '') + (config.url || '');
    console.log(`🚀 [Axios Outgoing Request] ${config.method?.toUpperCase()} -> ${fullUrl}`);
    return config;
  },
  (error) => {
    console.error('❌ [Axios Request Error]:', error);
    return Promise.reject(error);
  }
);

// 4. Response Interceptor with Automatic Backend Startup Retry Mechanism
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [Axios Response Received] ${response.config.method?.toUpperCase()} ${response.config.url} -> Status ${response.status}`);
    return response;
  },
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    // Initialize retry state for startup synchronization
    config.retryCount = config.retryCount || 0;
    const maxRetries = 10;
    const retryDelayMs = 1000;

    // Detect network connection failure or server initializing (503)
    const isStartupError = !error.response || error.response.status === 503 || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';

    if (isStartupError && config.retryCount < maxRetries) {
      config.retryCount += 1;
      console.warn(`⏳ [Backend Starting Up] Retrying request (${config.retryCount}/${maxRetries}) to ${config.url} in ${retryDelayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      return apiClient(config);
    }

    console.error(`❌ [Axios Final Failure] ${config.method?.toUpperCase()} ${config.url}:`, error.message || error);
    return Promise.reject(error);
  }
);

export const apiService = {
  /**
   * Health and schema metadata check
   */
  async getHealth() {
    try {
      const response = await apiClient.get('/api/health');
      return response.data;
    } catch (error) {
      // Fallback to root endpoint if /api/health is unavailable
      try {
        const rootResp = await apiClient.get('/');
        return rootResp.data;
      } catch (rootErr) {
        console.error('API Error (getHealth):', rootErr);
        throw rootErr;
      }
    }
  },

  /**
   * Fetch complete dataset
   */
  async getStockData() {
    try {
      const response = await apiClient.get('/api/stock-data');
      return response.data;
    } catch (error) {
      console.error('API Error (getStockData):', error);
      throw error;
    }
  },

  /**
   * Fetch latest stock record
   */
  async getLatestRecord() {
    try {
      const response = await apiClient.get('/api/latest');
      return response.data;
    } catch (error) {
      console.error('API Error (getLatestRecord):', error);
      throw error;
    }
  },

  /**
   * Fetch key statistics
   */
  async getStatistics() {
    try {
      const response = await apiClient.get('/api/statistics');
      return response.data;
    } catch (error) {
      console.error('API Error (getStatistics):', error);
      throw error;
    }
  },

  /**
   * Fetch chart data (last 100 records)
   */
  async getChartData() {
    try {
      const response = await apiClient.get('/api/chart');
      return response.data;
    } catch (error) {
      console.error('API Error (getChartData):', error);
      throw error;
    }
  },

  /**
   * Run closing price prediction
   * @param {Object} inputData - { open, high, low, close }
   */
  async predictPrice(inputData) {
    try {
      const response = await apiClient.post('/api/predict', {
        open: parseFloat(inputData.open),
        high: parseFloat(inputData.high),
        low: parseFloat(inputData.low),
        close: parseFloat(inputData.close),
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return response.data;
    } catch (error) {
      console.error('API Error (predictPrice):', error);
      if (error.response && error.response.data && error.response.data.detail) {
        throw new Error(error.response.data.detail);
      }
      throw error;
    }
  },
};

export default apiService;
