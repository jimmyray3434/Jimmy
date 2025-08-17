// Generate appropriate affiliate disclosure statements for different content types

/**
 * Generate an affiliate disclosure statement
 * @param {string} contentType - Type of content (blog, review, social, email)
 * @param {Object} options - Additional options
 * @returns {string} - Formatted disclosure statement
 */
const generateDisclosure = (contentType = 'blog', options = {}) => {
  const { 
    includeHeading = true,
    disclosureStyle = 'standard' // standard, minimal, detailed
  } = options;
  
  let disclosure = '';
  const heading = includeHeading ? '## Affiliate Disclosure\n\n' : '';
  
  switch (contentType.toLowerCase()) {
    case 'blog':
      if (disclosureStyle === 'minimal') {
        disclosure = `${heading}This post may contain affiliate links. If you purchase through these links, we may earn a commission at no additional cost to you.`;
      } else if (disclosureStyle === 'detailed') {
        disclosure = `${heading}This post may contain affiliate links. This means if you click on a link and make a purchase, we may receive a small commission at no additional cost to you. We only recommend products we genuinely believe in and have personally researched or used. Your support through these links helps us maintain this content and provide value to our readers. For more information about our affiliate partnerships, please see our [full disclosure policy](#).`;
      } else { // standard
        disclosure = `${heading}This post may contain affiliate links. When you purchase through links on our site, we may earn an affiliate commission. We only recommend products we believe will add value to our readers.`;
      }
      break;
      
    case 'review':
      if (disclosureStyle === 'minimal') {
        disclosure = `${heading}This review contains affiliate links. We may earn a commission if you make a purchase, at no extra cost to you.`;
      } else if (disclosureStyle === 'detailed') {
        disclosure = `${heading}This review contains affiliate links. As an affiliate, we earn from qualifying purchases made through these links. This means if you click on a link and purchase the reviewed product, we may receive a commission at no additional cost to you. We received no free products or compensation from the manufacturer to write this review. Our opinions are based on our own experience and research, and we only recommend products we believe in. For more information about our affiliate relationships, please see our [full disclosure policy](#).`;
      } else { // standard
        disclosure = `${heading}This review contains affiliate links. If you use these links to purchase a product, we may earn a commission at no additional cost to you. We test and review all products independently and only recommend those we believe provide value to our readers.`;
      }
      break;
      
    case 'social':
      // Social media disclosures need to be shorter
      if (disclosureStyle === 'minimal') {
        disclosure = `#ad #affiliate`;
      } else if (disclosureStyle === 'detailed') {
        disclosure = `This post contains affiliate links. If you purchase through these links, I may earn a commission. I only recommend products I personally believe in. #ad`;
      } else { // standard
        disclosure = `This post contains affiliate links. I may earn a commission on purchases at no cost to you. #ad`;
      }
      break;
      
    case 'email':
      if (disclosureStyle === 'minimal') {
        disclosure = `This email contains affiliate links. We may earn a commission on purchases.`;
      } else if (disclosureStyle === 'detailed') {
        disclosure = `${heading}This email contains affiliate links. When you purchase through these links, we receive a commission at no additional cost to you. We only recommend products we've personally researched or used. Your support helps us continue to provide valuable content. For more information, please see our full disclosure policy on our website.`;
      } else { // standard
        disclosure = `${heading}This email contains affiliate links. If you click these links and make a purchase, we may earn a commission at no additional cost to you. We appreciate your support!`;
      }
      break;
      
    case 'ebook':
      if (disclosureStyle === 'minimal') {
        disclosure = `${heading}This e-book contains affiliate links. The author may earn a commission on qualifying purchases.`;
      } else if (disclosureStyle === 'detailed') {
        disclosure = `${heading}This e-book contains affiliate links to products and services. This means if you click on a link and make a purchase, the author may receive a small commission at no additional cost to you. The author only recommends products they personally believe in or have thoroughly researched. These affiliate relationships help support the creation of free and low-cost content. For more information about our affiliate partnerships, please visit our website.`;
      } else { // standard
        disclosure = `${heading}This e-book contains affiliate links. When you purchase through these links, the author may earn a commission at no additional cost to you. Thank you for your support!`;
      }
      break;
      
    default:
      disclosure = `${heading}This content contains affiliate links. We may earn a commission when you make a purchase through these links at no additional cost to you.`;
  }
  
  return disclosure;
};

/**
 * Generate an Amazon Associates specific disclosure
 * @param {string} contentType - Type of content
 * @returns {string} - Amazon specific disclosure
 */
const generateAmazonDisclosure = (contentType = 'blog') => {
  const heading = '## Amazon Affiliate Disclosure\n\n';
  
  let disclosure = '';
  
  switch (contentType.toLowerCase()) {
    case 'blog':
    case 'review':
      disclosure = `${heading}As an Amazon Associate, we earn from qualifying purchases. This means that if you click on an Amazon link on this site and make a purchase, we may earn a commission at no additional cost to you.`;
      break;
      
    case 'social':
      disclosure = `As an Amazon Associate I earn from qualifying purchases. #amazonassociate`;
      break;
      
    case 'email':
      disclosure = `As an Amazon Associate, we earn from qualifying purchases made through the links in this email.`;
      break;
      
    case 'ebook':
      disclosure = `${heading}As an Amazon Associate, the author earns from qualifying purchases made through Amazon links in this e-book.`;
      break;
      
    default:
      disclosure = `${heading}As an Amazon Associate, we earn from qualifying purchases made through Amazon links in this content.`;
  }
  
  return disclosure;
};

/**
 * Generate a combined disclosure for multiple affiliate programs
 * @param {string} contentType - Type of content
 * @param {Array} networks - Array of affiliate networks being used
 * @returns {string} - Combined disclosure
 */
const generateCombinedDisclosure = (contentType = 'blog', networks = []) => {
  const heading = '## Affiliate Disclosure\n\n';
  let disclosure = heading;
  
  // Base disclosure
  disclosure += 'This content contains affiliate links from various programs. If you click on these links and make a purchase, we may earn a commission at no additional cost to you. ';
  
  // Add specific network disclosures
  if (networks.includes('amazon')) {
    disclosure += 'As an Amazon Associate, we earn from qualifying purchases. ';
  }
  
  if (networks.includes('shareasale')) {
    disclosure += 'We are also a participant in the ShareASale affiliate program. ';
  }
  
  if (networks.includes('cj')) {
    disclosure += 'We participate in the Commission Junction (CJ) affiliate program. ';
  }
  
  // Add final statement
  disclosure += 'We only recommend products we genuinely believe will be valuable to our readers.';
  
  return disclosure;
};

module.exports = {
  generateDisclosure,
  generateAmazonDisclosure,
  generateCombinedDisclosure
};

