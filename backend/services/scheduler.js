const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const Content = require('../models/Content');
const automationEngine = require('./automationEngine');

// Initialize scheduler
const initScheduler = () => {
  console.log('Initializing scheduler...');
  
  // Process tasks every minute
  cron.schedule('* * * * *', async () => {
    await processScheduledTasks();
  });
  
  // Generate content daily at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    await scheduleContentGeneration();
  });
  
  // Publish scheduled content every hour
  cron.schedule('0 * * * *', async () => {
    await publishScheduledContent();
  });
  
  // Generate analytics daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    await scheduleAnalyticsCollection();
  });
  
  // Update affiliate products weekly on Sunday at 3:00 AM
  cron.schedule('0 3 * * 0', async () => {
    await scheduleAffiliateUpdates();
  });
  
  // Generate digital products weekly on Monday at 4:00 AM
  cron.schedule('0 4 * * 1', async () => {
    await scheduleProductGeneration();
  });
  
  console.log('Scheduler initialized');
};

// Process scheduled tasks
const processScheduledTasks = async () => {
  try {
    // Find tasks that are scheduled to run now
    const now = new Date();
    const tasks = await Task.find({
      status: 'pending',
      scheduledFor: { $lte: now }
    })
    .sort({ priority: -1 })
    .limit(5); // Process 5 tasks at a time
    
    if (tasks.length === 0) {
      return;
    }
    
    console.log(`Processing ${tasks.length} scheduled tasks`);
    
    // Process each task
    for (const task of tasks) {
      // Update task status to in-progress
      task.status = 'in-progress';
      task.startedAt = new Date();
      await task.save();
      
      try {
        // Process task based on type
        let result;
        
        switch (task.type) {
          case 'content-generation':
            result = await automationEngine.generateContent(task.user, task.data);
            break;
          case 'content-publishing':
            result = await automationEngine.publishContent(task.user, task.data);
            break;
          case 'affiliate-update':
            result = await automationEngine.updateAffiliateProducts(task.user, task.data);
            break;
          case 'product-generation':
            result = await automationEngine.generateDigitalProduct(task.user, task.data);
            break;
          case 'analytics-collection':
            result = await automationEngine.collectAnalytics(task.user, task.data);
            break;
          case 'social-posting':
            result = await automationEngine.postToSocial(task.user, task.data);
            break;
          case 'email-sending':
            result = await automationEngine.sendEmail(task.user, task.data);
            break;
          case 'maintenance':
            result = await automationEngine.performMaintenance(task.user, task.data);
            break;
          default:
            result = {
              success: false,
              error: `Unknown task type: ${task.type}`
            };
        }
        
        // Update task with result
        task.status = result.success ? 'completed' : 'failed';
        task.result = result;
        task.completedAt = new Date();
        await task.save();
        
        console.log(`Task ${task._id} (${task.type}) completed with status: ${task.status}`);
      } catch (error) {
        console.error(`Error processing task ${task._id} (${task.type}):`, error);
        
        // Update task with error
        task.status = 'failed';
        task.result = {
          success: false,
          error: error.message
        };
        task.completedAt = new Date();
        await task.save();
      }
    }
  } catch (error) {
    console.error('Error processing scheduled tasks:', error);
  }
};

// Schedule content generation for all active users
const scheduleContentGeneration = async () => {
  try {
    // Find users with active content generation settings
    const users = await User.find({
      'settings.automation.scheduleActive': true
    });
    
    console.log(`Scheduling content generation for ${users.length} users`);
    
    for (const user of users) {
      // Create content generation task
      const task = new Task({
        user: user._id,
        type: 'content-generation',
        priority: 2,
        data: {
          settings: user.settings
        },
        scheduledFor: new Date()
      });
      
      await task.save();
    }
  } catch (error) {
    console.error('Error scheduling content generation:', error);
  }
};

// Publish scheduled content
const publishScheduledContent = async () => {
  try {
    // Find content scheduled to be published
    const now = new Date();
    const scheduledContent = await Content.find({
      status: 'scheduled',
      publishDate: { $lte: now }
    });
    
    console.log(`Publishing ${scheduledContent.length} scheduled content items`);
    
    for (const content of scheduledContent) {
      // Create content publishing task
      const task = new Task({
        user: content.user,
        type: 'content-publishing',
        priority: 3,
        data: {
          contentId: content._id
        },
        scheduledFor: new Date()
      });
      
      await task.save();
    }
  } catch (error) {
    console.error('Error publishing scheduled content:', error);
  }
};

// Schedule analytics collection for all active users
const scheduleAnalyticsCollection = async () => {
  try {
    // Find users with active automation settings
    const users = await User.find({
      'settings.automation.scheduleActive': true
    });
    
    console.log(`Scheduling analytics collection for ${users.length} users`);
    
    for (const user of users) {
      // Create analytics collection task
      const task = new Task({
        user: user._id,
        type: 'analytics-collection',
        priority: 1,
        data: {},
        scheduledFor: new Date()
      });
      
      await task.save();
    }
  } catch (error) {
    console.error('Error scheduling analytics collection:', error);
  }
};

// Schedule affiliate product updates for all active users
const scheduleAffiliateUpdates = async () => {
  try {
    // Find users with active automation settings
    const users = await User.find({
      'settings.automation.scheduleActive': true
    });
    
    console.log(`Scheduling affiliate updates for ${users.length} users`);
    
    for (const user of users) {
      // Create affiliate update task
      const task = new Task({
        user: user._id,
        type: 'affiliate-update',
        priority: 2,
        data: {
          settings: user.settings
        },
        scheduledFor: new Date()
      });
      
      await task.save();
    }
  } catch (error) {
    console.error('Error scheduling affiliate updates:', error);
  }
};

// Schedule digital product generation for all active users
const scheduleProductGeneration = async () => {
  try {
    // Find users with active automation settings and autoGenerate enabled
    const users = await User.find({
      'settings.automation.scheduleActive': true,
      'settings.digitalProducts.autoGenerate': true
    });
    
    console.log(`Scheduling product generation for ${users.length} users`);
    
    for (const user of users) {
      // Create product generation task
      const task = new Task({
        user: user._id,
        type: 'product-generation',
        priority: 2,
        data: {
          settings: user.settings
        },
        scheduledFor: new Date()
      });
      
      await task.save();
    }
  } catch (error) {
    console.error('Error scheduling product generation:', error);
  }
};

// Schedule a task manually
const scheduleTask = async (userId, taskType, data = {}, scheduledFor = new Date(), priority = 2) => {
  try {
    // Create task
    const task = new Task({
      user: userId,
      type: taskType,
      priority,
      data,
      scheduledFor
    });
    
    await task.save();
    
    return {
      success: true,
      task
    };
  } catch (error) {
    console.error('Error scheduling task:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get tasks for a user
const getUserTasks = async (userId, status = null, limit = 10, page = 1) => {
  try {
    // Build query
    const query = { user: userId };
    if (status) query.status = status;
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get tasks
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const total = await Task.countDocuments(query);
    
    return {
      success: true,
      count: tasks.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      tasks
    };
  } catch (error) {
    console.error('Error getting user tasks:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  initScheduler,
  scheduleTask,
  getUserTasks
};

