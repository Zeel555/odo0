import { useState, useCallback } from 'react';
import * as bomApi from '../api/bom';

/**
 * Custom hook for BOM data management.
 */
export const useBOM = () => {
  const [boms, setBoms] = useState([]);
  const [selectedBOM, setSelectedBOM] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBOMs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bomApi.getBOMs();
      setBoms(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load BOMs');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBOMById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bomApi.getBOMById(id);
      setSelectedBOM(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'BOM not found');
    } finally {
      setLoading(false);
    }
  }, []);

  const createBOM = useCallback(async (data) => {
    const res = await bomApi.createBOM(data);
    setBoms((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const updateBOM = useCallback(async (id, data) => {
    const res = await bomApi.updateBOM(id, data);
    setBoms((prev) => prev.map((b) => (b._id === id ? res.data : b)));
    return res.data;
  }, []);

  const archiveBOM = useCallback(async (id) => {
    const res = await bomApi.archiveBOM(id);
    setBoms((prev) => prev.map((b) => (b._id === id ? res.data.bom : b)));
    return res.data;
  }, []);

  return {
    boms, selectedBOM, loading, error,
    fetchBOMs, fetchBOMById, createBOM, updateBOM, archiveBOM,
  };
};
