import api from './authService';

export const crmService = {
  // Get all clients
  async getClients(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);

    return api.get(`/crm/clients?${queryParams.toString()}`);
  },

  // Get single client
  async getClient(clientId: string) {
    return api.get(`/crm/clients/${clientId}`);
  },

  // Create new client
  async createClient(clientData: any) {
    return api.post('/crm/clients', clientData);
  },

  // Update client
  async updateClient(clientId: string, updates: any) {
    return api.put(`/crm/clients/${clientId}`, updates);
  },

  // Delete client
  async deleteClient(clientId: string) {
    return api.delete(`/crm/clients/${clientId}`);
  },

  // Add communication to client
  async addCommunication(clientId: string, communication: any) {
    return api.post(`/crm/clients/${clientId}/communications`, communication);
  },

  // Add note to client
  async addNote(clientId: string, content: string) {
    return api.post(`/crm/clients/${clientId}/notes`, { content });
  },

  // Get CRM dashboard data
  async getDashboard() {
    return api.get('/crm/dashboard');
  },

  // Search clients
  async searchClients(query: string) {
    return api.get(`/crm/clients?search=${encodeURIComponent(query)}`);
  },

  // Get clients by status
  async getClientsByStatus(status: string) {
    return api.get(`/crm/clients?status=${status}`);
  },

  // Bulk update clients
  async bulkUpdateClients(clientIds: string[], updates: any) {
    return api.put('/crm/clients/bulk', { clientIds, updates });
  },

  // Export clients
  async exportClients(format: 'csv' | 'xlsx' = 'csv') {
    return api.get(`/crm/clients/export?format=${format}`, {
      responseType: 'blob'
    });
  },

  // Get client statistics
  async getClientStats() {
    return api.get('/crm/stats');
  },

  // Get overdue follow-ups
  async getOverdueFollowUps() {
    return api.get('/crm/clients?overdue=true');
  },

  // Update communication status
  async updateCommunication(clientId: string, communicationId: string, updates: any) {
    return api.put(`/crm/clients/${clientId}/communications/${communicationId}`, updates);
  },

  // Delete communication
  async deleteCommunication(clientId: string, communicationId: string) {
    return api.delete(`/crm/clients/${clientId}/communications/${communicationId}`);
  },

  // Delete note
  async deleteNote(clientId: string, noteId: string) {
    return api.delete(`/crm/clients/${clientId}/notes/${noteId}`);
  },

  // Get client activity timeline
  async getClientTimeline(clientId: string) {
    return api.get(`/crm/clients/${clientId}/timeline`);
  },

  // Add client tags
  async addClientTags(clientId: string, tags: string[]) {
    return api.post(`/crm/clients/${clientId}/tags`, { tags });
  },

  // Remove client tags
  async removeClientTags(clientId: string, tags: string[]) {
    return api.delete(`/crm/clients/${clientId}/tags`, { data: { tags } });
  },

  // Get all available tags
  async getAllTags() {
    return api.get('/crm/tags');
  },

  // Create custom field
  async createCustomField(fieldData: any) {
    return api.post('/crm/custom-fields', fieldData);
  },

  // Update custom field
  async updateCustomField(fieldId: string, updates: any) {
    return api.put(`/crm/custom-fields/${fieldId}`, updates);
  },

  // Delete custom field
  async deleteCustomField(fieldId: string) {
    return api.delete(`/crm/custom-fields/${fieldId}`);
  },

  // Get all custom fields
  async getCustomFields() {
    return api.get('/crm/custom-fields');
  }
};

