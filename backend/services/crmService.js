const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Automation = require('../models/Automation');
const EmailTemplate = require('../models/EmailTemplate');
const User = require('../models/User');

/**
 * CRM Service
 * Handles lead management, contact management, and automation
 */
class CRMService {
  /**
   * Create a new lead
   * @param {Object} leadData - Lead data
   * @returns {Promise<Object>} Created lead
   */
  async createLead(leadData) {
    try {
      // Create lead
      const lead = await Lead.create(leadData);
      
      // Check if lead should be automatically qualified
      if (this.shouldQualifyLead(lead)) {
        lead.status = 'qualified';
        lead.qualifiedAt = new Date();
        await lead.save();
        
        // Convert to contact if auto-conversion is enabled
        if (leadData.autoConvert) {
          await this.convertLeadToContact(lead._id);
        }
      }
      
      // Trigger automations for new lead
      await this.triggerLeadAutomations(lead);
      
      return lead;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw new Error(`Failed to create lead: ${error.message}`);
    }
  }

  /**
   * Get lead by ID
   * @param {string} leadId - Lead ID
   * @returns {Promise<Object>} Lead object
   */
  async getLeadById(leadId) {
    try {
      const lead = await Lead.findById(leadId);
      
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      return lead;
    } catch (error) {
      console.error('Error getting lead:', error);
      throw new Error(`Failed to get lead: ${error.message}`);
    }
  }

  /**
   * Get all leads for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, page, status)
   * @returns {Promise<Object>} Leads with pagination
   */
  async getUserLeads(userId, options = {}) {
    try {
      const limit = options.limit || 10;
      const page = options.page || 1;
      const skip = (page - 1) * limit;
      
      const query = { user: userId };
      
      if (options.status) {
        query.status = options.status;
      }
      
      if (options.source) {
        query.source = options.source;
      }
      
      if (options.search) {
        query.$or = [
          { email: { $regex: options.search, $options: 'i' } },
          { name: { $regex: options.search, $options: 'i' } },
          { company: { $regex: options.search, $options: 'i' } }
        ];
      }
      
      const leads = await Lead.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Lead.countDocuments(query);
      
      return {
        data: leads,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user leads:', error);
      throw new Error(`Failed to get leads: ${error.message}`);
    }
  }

  /**
   * Update lead
   * @param {string} leadId - Lead ID
   * @param {Object} updates - Lead updates
   * @returns {Promise<Object>} Updated lead
   */
  async updateLead(leadId, updates) {
    try {
      const lead = await Lead.findById(leadId);
      
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      // Update allowed fields
      const allowedUpdates = [
        'name', 'email', 'phone', 'company', 'status', 
        'source', 'tags', 'notes', 'customFields'
      ];
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          if (field === 'customFields' && updates.customFields) {
            // Merge custom fields
            lead.customFields = {
              ...lead.customFields,
              ...updates.customFields
            };
          } else {
            lead[field] = updates[field];
          }
        }
      });
      
      // Update status timestamps
      if (updates.status && updates.status !== lead.status) {
        switch (updates.status) {
          case 'qualified':
            lead.qualifiedAt = new Date();
            break;
          case 'disqualified':
            lead.disqualifiedAt = new Date();
            break;
        }
      }
      
      await lead.save();
      
      // Trigger automations for lead update
      await this.triggerLeadAutomations(lead, 'update');
      
      return lead;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw new Error(`Failed to update lead: ${error.message}`);
    }
  }

  /**
   * Delete lead
   * @param {string} leadId - Lead ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteLead(leadId) {
    try {
      const result = await Lead.deleteOne({ _id: leadId });
      
      if (result.deletedCount === 0) {
        throw new Error('Lead not found');
      }
      
      return { success: true, id: leadId };
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw new Error(`Failed to delete lead: ${error.message}`);
    }
  }

  /**
   * Convert lead to contact
   * @param {string} leadId - Lead ID
   * @returns {Promise<Object>} Created contact
   */
  async convertLeadToContact(leadId) {
    try {
      const lead = await Lead.findById(leadId);
      
      if (!lead) {
        throw new Error('Lead not found');
      }
      
      // Check if contact with this email already exists
      const existingContact = await Contact.findOne({ 
        user: lead.user,
        email: lead.email
      });
      
      if (existingContact) {
        // Update existing contact with lead data
        existingContact.leadSource = lead.source;
        existingContact.tags = [...new Set([...existingContact.tags, ...lead.tags])];
        existingContact.notes = existingContact.notes + '\n\n' + lead.notes;
        existingContact.customFields = {
          ...existingContact.customFields,
          ...lead.customFields
        };
        
        await existingContact.save();
        
        // Update lead status
        lead.status = 'converted';
        lead.convertedAt = new Date();
        lead.convertedContactId = existingContact._id;
        await lead.save();
        
        return existingContact;
      }
      
      // Create new contact from lead
      const contact = await Contact.create({
        user: lead.user,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        leadSource: lead.source,
        tags: lead.tags,
        notes: lead.notes,
        customFields: lead.customFields,
        status: 'active'
      });
      
      // Update lead status
      lead.status = 'converted';
      lead.convertedAt = new Date();
      lead.convertedContactId = contact._id;
      await lead.save();
      
      // Trigger automations for new contact
      await this.triggerContactAutomations(contact);
      
      return contact;
    } catch (error) {
      console.error('Error converting lead to contact:', error);
      throw new Error(`Failed to convert lead: ${error.message}`);
    }
  }

  /**
   * Create a new contact
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} Created contact
   */
  async createContact(contactData) {
    try {
      // Check if contact with this email already exists
      const existingContact = await Contact.findOne({ 
        user: contactData.user,
        email: contactData.email
      });
      
      if (existingContact) {
        throw new Error('Contact with this email already exists');
      }
      
      // Create contact
      const contact = await Contact.create(contactData);
      
      // Trigger automations for new contact
      await this.triggerContactAutomations(contact);
      
      return contact;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw new Error(`Failed to create contact: ${error.message}`);
    }
  }

  /**
   * Get contact by ID
   * @param {string} contactId - Contact ID
   * @returns {Promise<Object>} Contact object
   */
  async getContactById(contactId) {
    try {
      const contact = await Contact.findById(contactId);
      
      if (!contact) {
        throw new Error('Contact not found');
      }
      
      return contact;
    } catch (error) {
      console.error('Error getting contact:', error);
      throw new Error(`Failed to get contact: ${error.message}`);
    }
  }

  /**
   * Get all contacts for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, page, status)
   * @returns {Promise<Object>} Contacts with pagination
   */
  async getUserContacts(userId, options = {}) {
    try {
      const limit = options.limit || 10;
      const page = options.page || 1;
      const skip = (page - 1) * limit;
      
      const query = { user: userId };
      
      if (options.status) {
        query.status = options.status;
      }
      
      if (options.tags && options.tags.length > 0) {
        query.tags = { $in: options.tags };
      }
      
      if (options.search) {
        query.$or = [
          { email: { $regex: options.search, $options: 'i' } },
          { name: { $regex: options.search, $options: 'i' } },
          { company: { $regex: options.search, $options: 'i' } }
        ];
      }
      
      const contacts = await Contact.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Contact.countDocuments(query);
      
      return {
        data: contacts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user contacts:', error);
      throw new Error(`Failed to get contacts: ${error.message}`);
    }
  }

  /**
   * Update contact
   * @param {string} contactId - Contact ID
   * @param {Object} updates - Contact updates
   * @returns {Promise<Object>} Updated contact
   */
  async updateContact(contactId, updates) {
    try {
      const contact = await Contact.findById(contactId);
      
      if (!contact) {
        throw new Error('Contact not found');
      }
      
      // Update allowed fields
      const allowedUpdates = [
        'name', 'email', 'phone', 'company', 'status', 
        'tags', 'notes', 'customFields'
      ];
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          if (field === 'customFields' && updates.customFields) {
            // Merge custom fields
            contact.customFields = {
              ...contact.customFields,
              ...updates.customFields
            };
          } else {
            contact[field] = updates[field];
          }
        }
      });
      
      await contact.save();
      
      // Trigger automations for contact update
      await this.triggerContactAutomations(contact, 'update');
      
      return contact;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw new Error(`Failed to update contact: ${error.message}`);
    }
  }

  /**
   * Delete contact
   * @param {string} contactId - Contact ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteContact(contactId) {
    try {
      const result = await Contact.deleteOne({ _id: contactId });
      
      if (result.deletedCount === 0) {
        throw new Error('Contact not found');
      }
      
      return { success: true, id: contactId };
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw new Error(`Failed to delete contact: ${error.message}`);
    }
  }

  /**
   * Create a new automation
   * @param {Object} automationData - Automation data
   * @returns {Promise<Object>} Created automation
   */
  async createAutomation(automationData) {
    try {
      // Create automation
      const automation = await Automation.create(automationData);
      
      return automation;
    } catch (error) {
      console.error('Error creating automation:', error);
      throw new Error(`Failed to create automation: ${error.message}`);
    }
  }

  /**
   * Get all automations for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, page, status)
   * @returns {Promise<Object>} Automations with pagination
   */
  async getUserAutomations(userId, options = {}) {
    try {
      const limit = options.limit || 10;
      const page = options.page || 1;
      const skip = (page - 1) * limit;
      
      const query = { user: userId };
      
      if (options.status) {
        query.status = options.status;
      }
      
      if (options.triggerType) {
        query['trigger.type'] = options.triggerType;
      }
      
      const automations = await Automation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Automation.countDocuments(query);
      
      return {
        data: automations,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user automations:', error);
      throw new Error(`Failed to get automations: ${error.message}`);
    }
  }

  /**
   * Update automation
   * @param {string} automationId - Automation ID
   * @param {Object} updates - Automation updates
   * @returns {Promise<Object>} Updated automation
   */
  async updateAutomation(automationId, updates) {
    try {
      const automation = await Automation.findById(automationId);
      
      if (!automation) {
        throw new Error('Automation not found');
      }
      
      // Update allowed fields
      const allowedUpdates = [
        'name', 'description', 'status', 'trigger', 'actions', 'conditions'
      ];
      
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          automation[field] = updates[field];
        }
      });
      
      await automation.save();
      
      return automation;
    } catch (error) {
      console.error('Error updating automation:', error);
      throw new Error(`Failed to update automation: ${error.message}`);
    }
  }

  /**
   * Delete automation
   * @param {string} automationId - Automation ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAutomation(automationId) {
    try {
      const result = await Automation.deleteOne({ _id: automationId });
      
      if (result.deletedCount === 0) {
        throw new Error('Automation not found');
      }
      
      return { success: true, id: automationId };
    } catch (error) {
      console.error('Error deleting automation:', error);
      throw new Error(`Failed to delete automation: ${error.message}`);
    }
  }

  /**
   * Create a new email template
   * @param {Object} templateData - Email template data
   * @returns {Promise<Object>} Created email template
   */
  async createEmailTemplate(templateData) {
    try {
      // Create email template
      const template = await EmailTemplate.create(templateData);
      
      return template;
    } catch (error) {
      console.error('Error creating email template:', error);
      throw new Error(`Failed to create email template: ${error.message}`);
    }
  }

  /**
   * Get all email templates for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, page, category)
   * @returns {Promise<Object>} Email templates with pagination
   */
  async getUserEmailTemplates(userId, options = {}) {
    try {
      const limit = options.limit || 10;
      const page = options.page || 1;
      const skip = (page - 1) * limit;
      
      const query = { user: userId };
      
      if (options.category) {
        query.category = options.category;
      }
      
      if (options.search) {
        query.$or = [
          { name: { $regex: options.search, $options: 'i' } },
          { subject: { $regex: options.search, $options: 'i' } }
        ];
      }
      
      const templates = await EmailTemplate.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await EmailTemplate.countDocuments(query);
      
      return {
        data: templates,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user email templates:', error);
      throw new Error(`Failed to get email templates: ${error.message}`);
    }
  }

  /**
   * Check if lead should be automatically qualified
   * @param {Object} lead - Lead object
   * @returns {boolean} Whether lead should be qualified
   */
  shouldQualifyLead(lead) {
    // Check if lead has required fields
    if (!lead.email || !lead.name) {
      return false;
    }
    
    // Check if lead has a valid email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lead.email)) {
      return false;
    }
    
    // Additional qualification criteria can be added here
    
    return true;
  }

  /**
   * Trigger automations for a lead
   * @param {Object} lead - Lead object
   * @param {string} event - Event type (create, update)
   * @returns {Promise<void>}
   */
  async triggerLeadAutomations(lead, event = 'create') {
    try {
      // Find automations that match this trigger
      const automations = await Automation.find({
        user: lead.user,
        status: 'active',
        'trigger.type': event === 'create' ? 'new_lead' : 'lead_updated',
        'trigger.entityType': 'lead'
      });
      
      // Process each automation
      for (const automation of automations) {
        // Check if conditions are met
        if (this.checkAutomationConditions(automation, lead)) {
          // Execute actions
          await this.executeAutomationActions(automation, lead);
          
          // Update automation stats
          automation.stats.executionCount += 1;
          automation.stats.lastExecuted = new Date();
          await automation.save();
        }
      }
    } catch (error) {
      console.error('Error triggering lead automations:', error);
      // Don't throw error to prevent blocking the main flow
    }
  }

  /**
   * Trigger automations for a contact
   * @param {Object} contact - Contact object
   * @param {string} event - Event type (create, update)
   * @returns {Promise<void>}
   */
  async triggerContactAutomations(contact, event = 'create') {
    try {
      // Find automations that match this trigger
      const automations = await Automation.find({
        user: contact.user,
        status: 'active',
        'trigger.type': event === 'create' ? 'new_contact' : 'contact_updated',
        'trigger.entityType': 'contact'
      });
      
      // Process each automation
      for (const automation of automations) {
        // Check if conditions are met
        if (this.checkAutomationConditions(automation, contact)) {
          // Execute actions
          await this.executeAutomationActions(automation, contact);
          
          // Update automation stats
          automation.stats.executionCount += 1;
          automation.stats.lastExecuted = new Date();
          await automation.save();
        }
      }
    } catch (error) {
      console.error('Error triggering contact automations:', error);
      // Don't throw error to prevent blocking the main flow
    }
  }

  /**
   * Check if automation conditions are met
   * @param {Object} automation - Automation object
   * @param {Object} entity - Entity object (lead or contact)
   * @returns {boolean} Whether conditions are met
   */
  checkAutomationConditions(automation, entity) {
    // If no conditions, always return true
    if (!automation.conditions || automation.conditions.length === 0) {
      return true;
    }
    
    // Check each condition
    for (const condition of automation.conditions) {
      const { field, operator, value } = condition;
      
      // Get field value from entity
      let fieldValue;
      if (field.includes('.')) {
        // Handle nested fields (e.g., customFields.industry)
        const [parent, child] = field.split('.');
        fieldValue = entity[parent] ? entity[parent][child] : undefined;
      } else {
        fieldValue = entity[field];
      }
      
      // Check condition based on operator
      switch (operator) {
        case 'equals':
          if (fieldValue !== value) return false;
          break;
        case 'not_equals':
          if (fieldValue === value) return false;
          break;
        case 'contains':
          if (!fieldValue || !fieldValue.includes(value)) return false;
          break;
        case 'not_contains':
          if (fieldValue && fieldValue.includes(value)) return false;
          break;
        case 'starts_with':
          if (!fieldValue || !fieldValue.startsWith(value)) return false;
          break;
        case 'ends_with':
          if (!fieldValue || !fieldValue.endsWith(value)) return false;
          break;
        case 'greater_than':
          if (!fieldValue || fieldValue <= value) return false;
          break;
        case 'less_than':
          if (!fieldValue || fieldValue >= value) return false;
          break;
        case 'is_empty':
          if (fieldValue && fieldValue.length > 0) return false;
          break;
        case 'is_not_empty':
          if (!fieldValue || fieldValue.length === 0) return false;
          break;
        case 'in_list':
          if (!Array.isArray(value) || !value.includes(fieldValue)) return false;
          break;
        case 'not_in_list':
          if (Array.isArray(value) && value.includes(fieldValue)) return false;
          break;
      }
    }
    
    // All conditions passed
    return true;
  }

  /**
   * Execute automation actions
   * @param {Object} automation - Automation object
   * @param {Object} entity - Entity object (lead or contact)
   * @returns {Promise<void>}
   */
  async executeAutomationActions(automation, entity) {
    try {
      // Process each action
      for (const action of automation.actions) {
        switch (action.type) {
          case 'update_field':
            await this.executeUpdateFieldAction(action, entity);
            break;
          case 'add_tag':
            await this.executeAddTagAction(action, entity);
            break;
          case 'remove_tag':
            await this.executeRemoveTagAction(action, entity);
            break;
          case 'send_email':
            await this.executeSendEmailAction(action, entity);
            break;
          case 'create_task':
            await this.executeCreateTaskAction(action, entity);
            break;
          case 'convert_lead':
            if (entity.constructor.modelName === 'Lead') {
              await this.convertLeadToContact(entity._id);
            }
            break;
        }
      }
    } catch (error) {
      console.error('Error executing automation actions:', error);
      // Log error but continue with other automations
    }
  }

  /**
   * Execute update field action
   * @param {Object} action - Action object
   * @param {Object} entity - Entity object (lead or contact)
   * @returns {Promise<void>}
   */
  async executeUpdateFieldAction(action, entity) {
    try {
      const { field, value } = action.params;
      
      // Update entity field
      if (field.includes('.')) {
        // Handle nested fields (e.g., customFields.industry)
        const [parent, child] = field.split('.');
        if (!entity[parent]) {
          entity[parent] = {};
        }
        entity[parent][child] = value;
      } else {
        entity[field] = value;
      }
      
      await entity.save();
    } catch (error) {
      console.error('Error executing update field action:', error);
      throw error;
    }
  }

  /**
   * Execute add tag action
   * @param {Object} action - Action object
   * @param {Object} entity - Entity object (lead or contact)
   * @returns {Promise<void>}
   */
  async executeAddTagAction(action, entity) {
    try {
      const { tags } = action.params;
      
      // Add tags to entity
      if (!entity.tags) {
        entity.tags = [];
      }
      
      entity.tags = [...new Set([...entity.tags, ...tags])];
      
      await entity.save();
    } catch (error) {
      console.error('Error executing add tag action:', error);
      throw error;
    }
  }

  /**
   * Execute remove tag action
   * @param {Object} action - Action object
   * @param {Object} entity - Entity object (lead or contact)
   * @returns {Promise<void>}
   */
  async executeRemoveTagAction(action, entity) {
    try {
      const { tags } = action.params;
      
      // Remove tags from entity
      if (!entity.tags) {
        return;
      }
      
      entity.tags = entity.tags.filter(tag => !tags.includes(tag));
      
      await entity.save();
    } catch (error) {
      console.error('Error executing remove tag action:', error);
      throw error;
    }
  }

  /**
   * Execute send email action
   * @param {Object} action - Action object
   * @param {Object} entity - Entity object (lead or contact)
   * @returns {Promise<void>}
   */
  async executeSendEmailAction(action, entity) {
    try {
      const { templateId, delay } = action.params;
      
      // Get email template
      const template = await EmailTemplate.findById(templateId);
      
      if (!template) {
        throw new Error('Email template not found');
      }
      
      // Get user
      const user = await User.findById(entity.user);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // In a real implementation, this would send an email
      // For now, we'll just log it
      console.log(`[EMAIL] To: ${entity.email}, From: ${user.email}, Subject: ${template.subject}`);
      
      // Record email in entity's activity
      if (!entity.activity) {
        entity.activity = [];
      }
      
      entity.activity.push({
        type: 'email',
        description: `Email sent: ${template.subject}`,
        metadata: {
          templateId: template._id,
          subject: template.subject
        }
      });
      
      await entity.save();
    } catch (error) {
      console.error('Error executing send email action:', error);
      throw error;
    }
  }

  /**
   * Execute create task action
   * @param {Object} action - Action object
   * @param {Object} entity - Entity object (lead or contact)
   * @returns {Promise<void>}
   */
  async executeCreateTaskAction(action, entity) {
    try {
      const { title, description, dueDate } = action.params;
      
      // In a real implementation, this would create a task
      // For now, we'll just log it
      console.log(`[TASK] Title: ${title}, Description: ${description}, Due: ${dueDate}`);
      
      // Record task in entity's activity
      if (!entity.activity) {
        entity.activity = [];
      }
      
      entity.activity.push({
        type: 'task',
        description: `Task created: ${title}`,
        metadata: {
          title,
          description,
          dueDate
        }
      });
      
      await entity.save();
    } catch (error) {
      console.error('Error executing create task action:', error);
      throw error;
    }
  }
}

module.exports = new CRMService();

