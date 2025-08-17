const mongoose = require('mongoose');

const DigitalProductSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  type: {
    type: String,
    enum: ['ebook', 'template', 'course', 'software', 'printable', 'other'],
    required: [true, 'Please specify product type']
  },
  category: {
    type: String,
    required: [true, 'Please add a category']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price must be at least 0']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price must be at least 0']
  },
  filePath: String,
  fileSize: Number,
  fileType: String,
  coverImage: String,
  previewUrl: String,
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  tags: [String],
  features: [String],
  requirements: [String],
  contentOutline: String,
  generationPrompt: String,
  generationSettings: {
    model: String,
    temperature: Number,
    maxTokens: Number
  },
  salesPage: {
    headline: String,
    subheadline: String,
    benefits: [String],
    testimonials: [{
      name: String,
      text: String,
      rating: Number
    }],
    faqs: [{
      question: String,
      answer: String
    }],
    callToAction: String
  },
  performance: {
    views: {
      type: Number,
      default: 0
    },
    sales: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    refunds: {
      type: Number,
      default: 0
    },
    conversionRate: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    }
  },
  publishedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Set updatedAt before saving
DigitalProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate conversion rate
  if (this.performance.views > 0) {
    this.performance.conversionRate = (this.performance.sales / this.performance.views) * 100;
  }
  
  next();
});

module.exports = mongoose.model('DigitalProduct', DigitalProductSchema);

