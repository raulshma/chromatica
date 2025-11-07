import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export enum DataPersistKeys {
  USER = 'USER',
  WALLPAPER_CACHE = 'WALLPAPER_CACHE',
}

export function useDataPersist() {
  /**
   * set persistent data
   * @param key
   * @param data
   * @returns
   */
  const setPersistData = useCallback(async <T>(key: DataPersistKeys, data: T): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const jsonData = JSON.stringify(data);
      AsyncStorage.setItem(key, jsonData)
        .then(() => resolve(true))
        .catch(err => reject(err));
    });
  }, []);

  /**
   * get persistent data
   * @param key
   * @returns
   */
  const getPersistData = useCallback(async <T>(key: DataPersistKeys): Promise<T> => {
    return new Promise((resolve, reject) => {
      AsyncStorage.getItem(key)
        .then(res => resolve(res ? JSON.parse(res) : undefined))
        .catch(err => reject(err));
    });
  }, []);

  /**
   * remove persistent data by key
   * @param key
   * @returns
   */
  const removePersistData = useCallback((key: DataPersistKeys): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      AsyncStorage.removeItem(key)
        .then(() => resolve(true))
        .catch(err => reject(err));
    });
  }, []);

  /**
   * remove all persistent data
   * @returns
   */
  const removeAllPersistData = useCallback(async () => {
    return Promise.all(Object.values(DataPersistKeys).map(value => AsyncStorage.removeItem(value)));
  }, []);

  return { setPersistData, getPersistData, removePersistData, removeAllPersistData };
}
