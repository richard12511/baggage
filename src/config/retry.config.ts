export interface RetryConfig {
  retries: number;
  factor: number; //Exponential backoff factor
  minTimeout: number; //in ms
  maxTimeout: number; //in ms
  randomize: boolean; //add jitter to prevent thundering herd
}

export const publishRetryConfig: RetryConfig = {
  retries: 5,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 30000,
  randomize: true,
};

export const connectionRetryConfig: RetryConfig = {
  retries: 10,
  factor: 2,
  minTimeout: 2000,
  maxTimeout: 60000,
  randomize: true,
};
