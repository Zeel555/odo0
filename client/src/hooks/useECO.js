import { useState, useCallback } from 'react';
import * as ecoApi from '../api/eco';

/**
 * Custom hook for ECO data management.
 */
export const useECO = () => {
  const [ecos, setEcos] = useState([]);
  const [selectedECO, setSelectedECO] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchECOs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ecoApi.getECOs();
      setEcos(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ECOs');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchECOById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await ecoApi.getECOById(id);
      setSelectedECO(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'ECO not found');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchECOTimeline = useCallback(async (id) => {
    const res = await ecoApi.getECOTimeline(id);
    return res.data;
  }, []);

  const createECO = useCallback(async (data) => {
    const res = await ecoApi.createECO(data);
    setEcos((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const updateECO = useCallback(async (id, data) => {
    const res = await ecoApi.updateECO(id, data);
    setEcos((prev) => prev.map((e) => (e._id === id ? res.data : e)));
    return res.data;
  }, []);

  const validateECO = useCallback(async (id) => {
    const res = await ecoApi.validateECO(id);
    const updated = res.data;
    if (selectedECO?._id === id) setSelectedECO(updated);
    setEcos((prev) => prev.map((e) => (e._id === id ? updated : e)));
    return updated;
  }, [selectedECO]);

  const approveECO = useCallback(async (id) => {
    const res = await ecoApi.approveECO(id);
    const updated = res.data?.eco || res.data;
    if (selectedECO?._id === id) setSelectedECO(updated);
    setEcos((prev) => prev.map((e) => (e._id === id ? updated : e)));
    return res.data;
  }, [selectedECO]);

  const rejectECO = useCallback(async (id, reason) => {
    const res = await ecoApi.rejectECO(id, { reason });
    const updated = res.data?.eco || res.data;
    if (selectedECO?._id === id) setSelectedECO(updated);
    setEcos((prev) => prev.map((e) => (e._id === id ? updated : e)));
    return res.data;
  }, [selectedECO]);

  const applyECO = useCallback(async (id) => {
    const res = await ecoApi.applyECO(id);
    const updated = res.data?.eco || res.data;
    if (selectedECO?._id === id) setSelectedECO(updated);
    setEcos((prev) => prev.map((e) => (e._id === id ? updated : e)));
    return res.data;
  }, [selectedECO]);

  const addECOComment = useCallback(async (id, text) => {
    const res = await ecoApi.addECOComment(id, { text });
    const updated = res.data;
    if (selectedECO?._id === id) setSelectedECO(updated);
    return updated;
  }, [selectedECO]);

  const downloadECOExport = useCallback(async (id, title) => {
    const res = await ecoApi.exportECO(id);
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eco-${(title || 'export').replace(/[^\w\-]+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    ecos,
    selectedECO,
    loading,
    error,
    fetchECOs,
    fetchECOById,
    fetchECOTimeline,
    createECO,
    updateECO,
    validateECO,
    approveECO,
    rejectECO,
    applyECO,
    addECOComment,
    downloadECOExport,
  };
};
