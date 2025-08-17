const crmService = require('./crmService');
const trafficService = require('./trafficService');
const paymentService = require('./paymentService');
const Automation = require('../models/Automation');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Content = require('../models/Content');
const TrafficCampaign = require('../models/TrafficCampaign');
const SocialAccount = require('../models/SocialAccount');
const PaymentAccount = require('../models/PaymentAccount');
const User = require('../models/User');

/**
 * Automation Service
 * Handles the central automation engine for the platform
 */
class AutomationService {
  /**
   * Run all scheduled tasks
   * @returns {Promise<Object>} Results of scheduled tasks
   */
  async runScheduledTasks() {
    try {
      const results = {
        traffic: await this.runTrafficGeneration(),
        leads: await this.runLeadNurturing(),
        payments: await this.runPaymentProcessing(),
        content: await this.runContentGeneration(),
        automations: await this.runScheduledAutomations()
      };
      
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Error running scheduled tasks:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run traffic generation for eligible content
   * @returns {Promise<Object>} Traffic generation results
   */
  async runTrafficGeneration() {
    try {
      const results = await trafficService.generateTrafficForAllEligibleContent();
      
      return {
        success: true,
        count: results.length,
        results
      };
    } catch (error) {
      console.error('Error running traffic generation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run lead nurturing automations
   * @returns {Promise<Object>} Lead nurturing results
   */
  async runLeadNurturing() {
    try {
      // Find all active automations for lead nurturing
      const automations = await Automation.find({
        status: 'active',
        'trigger.type': { $in: ['scheduled', 'lead_updated', 'new_lead'] }
      });
      
      const results = [];
      
      // Process each automation
      for (const automation of automations) {
        try {
          // Find eligible leads based on automation conditions
          const leads = await this.findEligibleLeads(automation);
          
          // Process each lead
          for (const lead of leads) {
            try {
              // Execute automation actions
              await crmService.executeAutomationActions(automation, lead);
              
              // Record successful execution
              await automation.recordExecution(true);
              
              results.push({
                automationId: automation._id,
                leadId: lead._id,
                success: true
              });
            } catch (error) {
              console.error(`Error processing lead ${lead._id} for automation ${automation._id}:`, error);
              
              // Record failed execution
              await automation.recordExecution(false);
              
              results.push({
                automationId: automation._id,
                leadId: lead._id,
                success: false,
                error: error.message
              });
            }
          }
        } catch (error) {
          console.error(`Error processing automation ${automation._id}:`, error);
          results.push({
            automationId: automation._id,
            success: false,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        count: results.length,
        results
      };
    } catch (error) {
      console.error('Error running lead nurturing:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run payment processing (withdrawals, etc.)
   * @returns {Promise<Object>} Payment processing results
   */
  async runPaymentProcessing() {
    try {
      // Process automated withdrawals
      const withdrawals = await paymentService.processAutomatedWithdrawals();
      
      return {
        success: true,
        count: withdrawals.length,
        withdrawals
      };
    } catch (error) {
      console.error('Error running payment processing:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run content generation (placeholder for AI content generation)
   * @returns {Promise<Object>} Content generation results
   */
  async runContentGeneration() {
    try {
      // In a real implementation, this would generate content using AI
      // For now, we'll return a placeholder
      
      return {
        success: true,
        count: 0,
        message: 'Content generation not implemented yet'
      };
    } catch (error) {
      console.error('Error running content generation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run scheduled automations
   * @returns {Promise<Object>} Automation results
   */
  async runScheduledAutomations() {
    try {
      // Find all scheduled automations due for execution
      const automations = await Automation.findScheduledDue();
      
      const results = [];
      
      // Process each automation
      for (const automation of automations) {
        try {
          // Execute automation based on entity type
          if (automation.trigger.entityType === 'lead' || automation.trigger.entityType === 'both') {
            const leadResults = await this.executeScheduledAutomationForLeads(automation);
            results.push({
              automationId: automation._id,
              entityType: 'lead',
              count: leadResults.length,
              success: true
            });
          }
          
          if (automation.trigger.entityType === 'contact' || automation.trigger.entityType === 'both') {
            const contactResults = await this.executeScheduledAutomationForContacts(automation);
            results.push({
              automationId: automation._id,
              entityType: 'contact',
              count: contactResults.length,
              success: true
            });
          }
          
          // Record successful execution
          await automation.recordExecution(true);
        } catch (error) {
          console.error(`Error processing scheduled automation ${automation._id}:`, error);
          
          // Record failed execution
          await automation.recordExecution(false);
          
          results.push({
            automationId: automation._id,
            success: false,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        count: results.length,
        results
      };
    } catch (error) {
      console.error('Error running scheduled automations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find eligible leads for an automation
   * @param {Object} automation - Automation object
   * @returns {Promise<Array>} Array of eligible leads
   */
  async findEligibleLeads(automation) {
    try {
      // Base query
      const query = { status: { $ne: 'converted' } };
      
      // Add user filter if automation is user-specific
      if (automation.user) {
        query.user = automation.user;
      }
      
      // Add specific conditions based on automation
      if (automation.conditions && automation.conditions.length > 0) {
        query.$and = [];
        
        for (const condition of automation.conditions) {
          const { field, operator, value } = condition;
          
          // Handle different operators
          switch (operator) {
            case 'equals':
              query.$and.push({ [field]: value });
              break;
            case 'not_equals':
              query.$and.push({ [field]: { $ne: value } });
              break;
            case 'contains':
              query.$and.push({ [field]: { $regex: value, $options: 'i' } });
              break;
            case 'not_contains':
              query.$and.push({ [field]: { $not: { $regex: value, $options: 'i' } } });
              break;
            case 'starts_with':
              query.$and.push({ [field]: { $regex: `^${value}`, $options: 'i' } });
              break;
            case 'ends_with':
              query.$and.push({ [field]: { $regex: `${value}$`, $options: 'i' } });
              break;
            case 'greater_than':
              query.$and.push({ [field]: { $gt: value } });
              break;
            case 'less_than':
              query.$and.push({ [field]: { $lt: value } });
              break;
            case 'is_empty':
              query.$and.push({ $or: [{ [field]: { $exists: false } }, { [field]: '' }] });
              break;
            case 'is_not_empty':
              query.$and.push({ [field]: { $exists: true, $ne: '' } });
              break;
            case 'in_list':
              query.$and.push({ [field]: { $in: value } });
              break;
            case 'not_in_list':
              query.$and.push({ [field]: { $nin: value } });
              break;
          }
        }
      }
      
      // Find leads matching the query
      return await Lead.find(query);
    } catch (error) {
      console.error('Error finding eligible leads:', error);
      throw new Error(`Failed to find eligible leads: ${error.message}`);
    }
  }

  /**
   * Execute scheduled automation for leads
   * @param {Object} automation - Automation object
   * @returns {Promise<Array>} Array of execution results
   */
  async executeScheduledAutomationForLeads(automation) {
    try {
      // Find eligible leads
      const leads = await this.findEligibleLeads(automation);
      
      const results = [];
      
      // Process each lead
      for (const lead of leads) {
        try {
          // Execute automation actions
          await crmService.executeAutomationActions(automation, lead);
          
          results.push({
            leadId: lead._id,
            success: true
          });
        } catch (error) {
          console.error(`Error executing automation for lead ${lead._id}:`, error);
          results.push({
            leadId: lead._id,
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error executing scheduled automation for leads:', error);
      throw new Error(`Failed to execute scheduled automation: ${error.message}`);
    }
  }

  /**
   * Execute scheduled automation for contacts
   * @param {Object} automation - Automation object
   * @returns {Promise<Array>} Array of execution results
   */
  async executeScheduledAutomationForContacts(automation) {
    try {
      // Find eligible contacts
      const contacts = await this.findEligibleContacts(automation);
      
      const results = [];
      
      // Process each contact
      for (const contact of contacts) {
        try {
          // Execute automation actions
          await crmService.executeAutomationActions(automation, contact);
          
          results.push({
            contactId: contact._id,
            success: true
          });
        } catch (error) {
          console.error(`Error executing automation for contact ${contact._id}:`, error);
          results.push({
            contactId: contact._id,
            success: false,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error executing scheduled automation for contacts:', error);
      throw new Error(`Failed to execute scheduled automation: ${error.message}`);
    }
  }

  /**
   * Find eligible contacts for an automation
   * @param {Object} automation - Automation object
   * @returns {Promise<Array>} Array of eligible contacts
   */
  async findEligibleContacts(automation) {
    try {
      // Base query
      const query = {};
      
      // Add user filter if automation is user-specific
      if (automation.user) {
        query.user = automation.user;
      }
      
      // Add specific conditions based on automation
      if (automation.conditions && automation.conditions.length > 0) {
        query.$and = [];
        
        for (const condition of automation.conditions) {
          const { field, operator, value } = condition;
          
          // Handle different operators (same as findEligibleLeads)
          switch (operator) {
            case 'equals':
              query.$and.push({ [field]: value });
              break;
            case 'not_equals':
              query.$and.push({ [field]: { $ne: value } });
              break;
            case 'contains':
              query.$and.push({ [field]: { $regex: value, $options: 'i' } });
              break;
            case 'not_contains':
              query.$and.push({ [field]: { $not: { $regex: value, $options: 'i' } } });
              break;
            case 'starts_with':
              query.$and.push({ [field]: { $regex: `^${value}`, $options: 'i' } });
              break;
            case 'ends_with':
              query.$and.push({ [field]: { $regex: `${value}$`, $options: 'i' } });
              break;
            case 'greater_than':
              query.$and.push({ [field]: { $gt: value } });
              break;
            case 'less_than':
              query.$and.push({ [field]: { $lt: value } });
              break;
            case 'is_empty':
              query.$and.push({ $or: [{ [field]: { $exists: false } }, { [field]: '' }] });
              break;
            case 'is_not_empty':
              query.$and.push({ [field]: { $exists: true, $ne: '' } });
              break;
            case 'in_list':
              query.$and.push({ [field]: { $in: value } });
              break;
            case 'not_in_list':
              query.$and.push({ [field]: { $nin: value } });
              break;
          }
        }
      }
      
      // Find contacts matching the query
      return await Contact.find(query);
    } catch (error) {
      console.error('Error finding eligible contacts:', error);
      throw new Error(`Failed to find eligible contacts: ${error.message}`);
    }
  }

  /**
   * Get automation statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Automation statistics
   */
  async getAutomationStats(userId) {
    try {
      // Get all automations for the user
      const automations = await Automation.find({ user: userId });
      
      // Calculate statistics
      const totalAutomations = automations.length;
      const activeAutomations = automations.filter(a => a.status === 'active').length;
      const pausedAutomations = automations.filter(a => a.status === 'paused').length;
      const draftAutomations = automations.filter(a => a.status === 'draft').length;
      
      let totalExecutions = 0;
      let successfulExecutions = 0;
      let failedExecutions = 0;
      
      automations.forEach(automation => {
        totalExecutions += automation.stats.executionCount || 0;
        successfulExecutions += automation.stats.successCount || 0;
        failedExecutions += automation.stats.failureCount || 0;
      });
      
      // Get automation types
      const triggerTypes = {};
      automations.forEach(automation => {
        const type = automation.trigger.type;
        triggerTypes[type] = (triggerTypes[type] || 0) + 1;
      });
      
      return {
        totalAutomations,
        activeAutomations,
        pausedAutomations,
        draftAutomations,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
        triggerTypes
      };
    } catch (error) {
      console.error('Error getting automation stats:', error);
      throw new Error(`Failed to get automation stats: ${error.message}`);
    }
  }

  /**
   * Get system-wide automation statistics
   * @returns {Promise<Object>} System-wide automation statistics
   */
  async getSystemAutomationStats() {
    try {
      // Get all automations
      const automations = await Automation.find();
      
      // Calculate statistics
      const totalAutomations = automations.length;
      const activeAutomations = automations.filter(a => a.status === 'active').length;
      
      let totalExecutions = 0;
      let successfulExecutions = 0;
      let failedExecutions = 0;
      
      automations.forEach(automation => {
        totalExecutions += automation.stats.executionCount || 0;
        successfulExecutions += automation.stats.successCount || 0;
        failedExecutions += automation.stats.failureCount || 0;
      });
      
      // Get automation types
      const triggerTypes = {};
      automations.forEach(automation => {
        const type = automation.trigger.type;
        triggerTypes[type] = (triggerTypes[type] || 0) + 1;
      });
      
      // Get user count with automations
      const userIds = new Set();
      automations.forEach(automation => {
        if (automation.user) {
          userIds.add(automation.user.toString());
        }
      });
      
      return {
        totalAutomations,
        activeAutomations,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
        triggerTypes,
        usersWithAutomations: userIds.size
      };
    } catch (error) {
      console.error('Error getting system automation stats:', error);
      throw new Error(`Failed to get system automation stats: ${error.message}`);
    }
  }
}

module.exports = new AutomationService();

