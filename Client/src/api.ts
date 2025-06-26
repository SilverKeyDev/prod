import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const generateReport = async (address: string, notes?: string, files?: File[]) => {
  const formData = new FormData();
  formData.append('address', address);
  if (notes) formData.append('notes', notes);
  if (files) {
    files.forEach(file => formData.append('files', file));
  }

  const response = await axios.post(`${API_BASE_URL}/generate-report`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getReports = async (): Promise<{ reports: Report[] }> => {
  const response = await axios.get(`${API_BASE_URL}/reports`);
  return response.data;
};

export const getReport = async (reportId: number): Promise<{ report: Report }> => {
  const response = await axios.get(`${API_BASE_URL}/reports/${reportId}`);
  return response.data;
};

export const downloadReport = async (reportId: number) => {
  const response = await axios.get(`${API_BASE_URL}/reports/${reportId}/download`, {
    responseType: 'blob',
  });
  return response.data;
};