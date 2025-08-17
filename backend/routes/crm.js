const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const crmService = require('../services/crmService');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Automation = require('../models/Automation');
const EmailTemplate = require('../models/EmailTemplate');

/**
 * @route   GET /api/crm/leads
 * @desc    Get user's leads
 * @access  Private
 */
router.get('/leads', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, source, search } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
      source,
      search
    };
    
    const leads = await crmService.getUserLeads(req.user.id, options);
    
    res.json({
      success: true,
      data: leads.data,
      pagination: leads.pagination
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   GET /api/crm/leads/:id
 * @desc    Get lead by ID
 * @access  Private
 */
router.get('/leads/:id', protect, async (req, res) => {
  try {
    const lead = await crmService.getLeadById(req.params.id);
    
    // Check if lead belongs to user
    if (lead.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this lead'
      });
    }
    
    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/crm/leads
 * @desc    Create new lead
 * @access  Private
 */
router.post('/leads', protect, async (req, res) => {
  try {
    const { name, email, phone, company, source, tags, notes, customFields, autoConvert } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }
    
    // Create lead data
    const leadData = {
      user: req.user.id,
      name,
      email,
      phone,
      company,
      source,
      tags,
      notes,
      customFields,
      autoConvert
    };
    
    const lead = await crmService.createLead(leadData);
    
    res.status(201).json({
      success: true,
      data: lead,
      message: 'Lead created successfully'
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   PUT /api/crm/leads/:id
 * @desc    Update lead
 * @access  Private
 */
router.put('/leads/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    // Check if lead belongs to user
    if (lead.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this lead'
      });
    }
    
    const updatedLead = await crmService.updateLead(req.params.id, req.body);
    
    res.json({
      success: true,
      data: updatedLead,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   DELETE /api/crm/leads/:id
 * @desc    Delete lead
 * @access  Private
 */
router.delete('/leads/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    // Check if lead belongs to user
    if (lead.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this lead'
      });
    }
    
    await crmService.deleteLead(req.params.id);
    
    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/crm/leads/:id/convert
 * @desc    Convert lead to contact
 * @access  Private
 */
router.post('/leads/:id/convert', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    // Check if lead belongs to user
    if (lead.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to convert this lead'
      });
    }
    
    // Check if lead is already converted
    if (lead.status === 'converted') {
      return res.status(400).json({
        success: false,
        error: 'Lead is already converted'
      });
    }
    
    const contact = await crmService.convertLeadToContact(req.params.id);
    
    res.json({
      success: true,
      data: contact,
      message: 'Lead converted to contact successfully'
    });
  } catch (error) {
    console.error('Error converting lead:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/crm/leads/:id/activity
 * @desc    Add activity to lead
 * @access  Private
 */
router.post('/leads/:id/activity', protect, async (req, res) => {
  try {
    const { type, description, metadata } = req.body;
    
    if (!type || !description) {
      return res.status(400).json({
        success: false,
        error: 'Type and description are required'
      });
    }
    
    const lead = await Lead.findById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    // Check if lead belongs to user
    if (lead.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add activity to this lead'
      });
    }
    
    // Add activity
    const activity = {
      type,
      description,
      createdAt: new Date(),
      metadata: metadata || {}
    };
    
    const updatedLead = await lead.addActivity(activity);
    
    res.json({
      success: true,
      data: updatedLead,
      message: 'Activity added successfully'
    });
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   GET /api/crm/contacts
 * @desc    Get user's contacts
 * @access  Private
 */
router.get('/contacts', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, tags, search } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
      tags: tags ? tags.split(',') : undefined,
      search
    };
    
    const contacts = await crmService.getUserContacts(req.user.id, options);
    
    res.json({
      success: true,
      data: contacts.data,
      pagination: contacts.pagination
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   GET /api/crm/contacts/:id
 * @desc    Get contact by ID
 * @access  Private
 */
router.get('/contacts/:id', protect, async (req, res) => {
  try {
    const contact = await crmService.getContactById(req.params.id);
    
    // Check if contact belongs to user
    if (contact.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this contact'
      });
    }
    
    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/crm/contacts
 * @desc    Create new contact
 * @access  Private
 */
router.post('/contacts', protect, async (req, res) => {
  try {
    const { name, email, phone, company, tags, notes, customFields } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }
    
    // Create contact data
    const contactData = {
      user: req.user.id,
      name,
      email,
      phone,
      company,
      tags,
      notes,
      customFields
    };
    
    const contact = await crmService.createContact(contactData);
    
    res.status(201).json({
      success: true,
      data: contact,
      message: 'Contact created successfully'
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(error.message.includes('already exists') ? 400 : 500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   PUT /api/crm/contacts/:id
 * @desc    Update contact
 * @access  Private
 */
router.put('/contacts/:id', protect, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }
    
    // Check if contact belongs to user
    if (contact.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this contact'
      });
    }
    
    const updatedContact = await crmService.updateContact(req.params.id, req.body);
    
    res.json({
      success: true,
      data: updatedContact,
      message: 'Contact updated successfully'
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   DELETE /api/crm/contacts/:id
 * @desc    Delete contact
 * @access  Private
 */
router.delete('/contacts/:id', protect, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }
    
    // Check if contact belongs to user
    if (contact.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this contact'
      });
    }
    
    await crmService.deleteContact(req.params.id);
    
    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/crm/contacts/:id/activity
 * @desc    Add activity to contact
 * @access  Private
 */
router.post('/contacts/:id/activity', protect, async (req, res) => {
  try {
    const { type, description, metadata } = req.body;
    
    if (!type || !description) {
      return res.status(400).json({
        success: false,
        error: 'Type and description are required'
      });
    }
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }
    
    // Check if contact belongs to user
    if (contact.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add activity to this contact'
      });
    }
    
    // Add activity
    const activity = {
      type,
      description,
      createdAt: new Date(),
      metadata: metadata || {}
    };
    
    const updatedContact = await contact.addActivity(activity);
    
    res.json({
      success: true,
      data: updatedContact,
      message: 'Activity added successfully'
    });
  } catch (error) {
    console.error('Error adding activity:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/crm/contacts/:id/purchase
 * @desc    Record purchase for contact
 * @access  Private
 */
router.post('/contacts/:id/purchase', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }
    
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }
    
    // Check if contact belongs to user
    if (contact.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to record purchase for this contact'
      });
    }
    
    // Record purchase
    const updatedContact = await contact.recordPurchase(parseFloat(amount));
    
    res.json({
      success: true,
      data: updatedContact,
      message: 'Purchase recorded successfully'
    });
  } catch (error) {
    console.error('Error recording purchase:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   GET /api/crm/automations
 * @desc    Get user's automations
 * @access  Private
 */
router.get('/automations', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, triggerType } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
      triggerType
    };
    
    const automations = await crmService.getUserAutomations(req.user.id, options);
    
    res.json({
      success: true,
      data: automations.data,
      pagination: automations.pagination
    });
  } catch (error) {
    console.error('Error fetching automations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/crm/automations
 * @desc    Create new automation
 * @access  Private
 */
router.post('/automations', protect, async (req, res) => {
  try {
    const { name, description, trigger, conditions, actions } = req.body;
    
    if (!name || !trigger || !actions || !Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, trigger, and at least one action are required'
      });
    }
    
    // Create automation data
    const automationData = {
      user: req.user.id,
      name,
      description,
      trigger,
      conditions: conditions || [],
      actions
    };
    
    const automation = await crmService.createAutomation(automationData);
    
    res.status(201).json({
      success: true,
      data: automation,
      message: 'Automation created successfully'
    });
  } catch (error) {
    console.error('Error creating automation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   PUT /api/crm/automations/:id
 * @desc    Update automation
 * @access  Private
 */
router.put('/automations/:id', protect, async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.id);
    
    if (!automation) {
      return res.status(404).json({
        success: false,
        error: 'Automation not found'
      });
    }
    
    // Check if automation belongs to user
    if (automation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this automation'
      });
    }
    
    const updatedAutomation = await crmService.updateAutomation(req.params.id, req.body);
    
    res.json({
      success: true,
      data: updatedAutomation,
      message: 'Automation updated successfully'
    });
  } catch (error) {
    console.error('Error updating automation:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   DELETE /api/crm/automations/:id
 * @desc    Delete automation
 * @access  Private
 */
router.delete('/automations/:id', protect, async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.id);
    
    if (!automation) {
      return res.status(404).json({
        success: false,
        error: 'Automation not found'
      });
    }
    
    // Check if automation belongs to user
    if (automation.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this automation'
      });
    }
    
    await crmService.deleteAutomation(req.params.id);
    
    res.json({
      success: true,
      message: 'Automation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting automation:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   GET /api/crm/email-templates
 * @desc    Get user's email templates
 * @access  Private
 */
router.get('/email-templates', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      category,
      search
    };
    
    const templates = await crmService.getUserEmailTemplates(req.user.id, options);
    
    res.json({
      success: true,
      data: templates.data,
      pagination: templates.pagination
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

/**
 * @route   POST /api/crm/email-templates
 * @desc    Create new email template
 * @access  Private
 */
router.post('/email-templates', protect, async (req, res) => {
  try {
    const { name, subject, body, category, description, isHtml, variables } = req.body;
    
    if (!name || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'Name, subject, and body are required'
      });
    }
    
    // Create template data
    const templateData = {
      user: req.user.id,
      name,
      subject,
      body,
      category: category || 'other',
      description,
      isHtml: isHtml !== undefined ? isHtml : true,
      variables: variables || []
    };
    
    const template = await crmService.createEmailTemplate(templateData);
    
    res.status(201).json({
      success: true,
      data: template,
      message: 'Email template created successfully'
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});

module.exports = router;

