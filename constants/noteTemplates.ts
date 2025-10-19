/**
 * Note Templates
 * Pre-built templates for common note types with smart placeholders
 */

export interface NoteTemplate {
  id: string;
  name: string;
  icon: string;
  category: TemplateCategory;
  description: string;
  content: string;
  color?: string;
  hasSmartFields?: boolean; // Can be filled with AI
  isChecklistTemplate?: boolean; // If true, this template creates a checklist instead of HTML content
  checklistItems?: Array<{ text: string; completed: boolean }>; // Pre-filled checklist items
}

export enum TemplateCategory {
  PRODUCTIVITY = 'Productivity',
  PERSONAL = 'Personal',
  WORK = 'Work',
  CREATIVE = 'Creative',
  EDUCATION = 'Education',
  HEALTH = 'Health & Fitness',
  FINANCE = 'Finance',
  EVENTS = 'Events',
}

export const NOTE_TEMPLATES: NoteTemplate[] = [
  // PRODUCTIVITY
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    icon: '📝',
    category: TemplateCategory.PRODUCTIVITY,
    description: 'Structured meeting notes template',
    hasSmartFields: true,
    content: '<h2>Meeting Notes</h2>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '<p><strong>Attendees:</strong> {{ATTENDEES}}</p>\n' +
      '<p><strong>Topic:</strong> {{TOPIC}}</p>\n' +
      '\n' +
      '<h3>Agenda</h3>\n' +
      '<ul>\n' +
      '  <li>{{AGENDA_ITEM_1}}</li>\n' +
      '  <li>{{AGENDA_ITEM_2}}</li>\n' +
      '  <li>{{AGENDA_ITEM_3}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Discussion Points</h3>\n' +
      '<p>{{DISCUSSION}}</p>\n' +
      '\n' +
      '<h3>Action Items</h3>\n' +
      '<ul>\n' +
      '  <li>{{ACTION_1}}</li>\n' +
      '  <li>{{ACTION_2}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Next Steps</h3>\n' +
      '<p>{{NEXT_STEPS}}</p>',
  },
  {
    id: 'todo-list',
    name: 'To-Do List',
    icon: '✅',
    category: TemplateCategory.PRODUCTIVITY,
    description: 'Interactive checklist with priorities',
    isChecklistTemplate: true,
    content: '', // Not used for checklist templates
    checklistItems: [
      { text: 'High Priority Task 1', completed: false },
      { text: 'High Priority Task 2', completed: false },
      { text: 'Medium Priority Task 1', completed: false },
      { text: 'Medium Priority Task 2', completed: false },
      { text: 'Low Priority Task 1', completed: false },
      { text: 'Low Priority Task 2', completed: false },
    ],
  },
  {
    id: 'project-plan',
    name: 'Project Plan',
    icon: '🎯',
    category: TemplateCategory.PRODUCTIVITY,
    description: 'Project planning template',
    hasSmartFields: true,
    content: '<h2>Project Plan</h2>\n' +
      '<p><strong>Project Name:</strong> {{PROJECT_NAME}}</p>\n' +
      '<p><strong>Start Date:</strong> {{START_DATE}}</p>\n' +
      '<p><strong>Deadline:</strong> {{DEADLINE}}</p>\n' +
      '\n' +
      '<h3>Objective</h3>\n' +
      '<p>{{OBJECTIVE}}</p>\n' +
      '\n' +
      '<h3>Key Deliverables</h3>\n' +
      '<ul>\n' +
      '  <li>{{DELIVERABLE_1}}</li>\n' +
      '  <li>{{DELIVERABLE_2}}</li>\n' +
      '  <li>{{DELIVERABLE_3}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Timeline</h3>\n' +
      '<p>{{TIMELINE}}</p>\n' +
      '\n' +
      '<h3>Resources Needed</h3>\n' +
      '<p>{{RESOURCES}}</p>\n' +
      '\n' +
      '<h3>Risks & Mitigation</h3>\n' +
      '<p>{{RISKS}}</p>',
  },
  {
    id: 'daily-standup',
    name: 'Daily Standup',
    icon: '☕',
    category: TemplateCategory.PRODUCTIVITY,
    description: 'Quick daily status update',
    content: '<h2>Daily Standup</h2>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '\n' +
      '<h3>✅ What I Did Yesterday</h3>\n' +
      '<ul>\n' +
      '  <li></li>\n' +
      '  <li></li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>🎯 What I\'ll Do Today</h3>\n' +
      '<ul>\n' +
      '  <li></li>\n' +
      '  <li></li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>🚧 Blockers/Issues</h3>\n' +
      '<p>None / {{BLOCKERS}}</p>',
  },
  {
    id: 'bug-report',
    name: 'Bug Report',
    icon: '🐛',
    category: TemplateCategory.PRODUCTIVITY,
    description: 'Document bugs systematically',
    hasSmartFields: true,
    content: '<h2>Bug Report</h2>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '<p><strong>Reporter:</strong> {{REPORTER}}</p>\n' +
      '<p><strong>Severity:</strong> {{SEVERITY}}</p>\n' +
      '\n' +
      '<h3>Description</h3>\n' +
      '<p>{{DESCRIPTION}}</p>\n' +
      '\n' +
      '<h3>Steps to Reproduce</h3>\n' +
      '<ol>\n' +
      '  <li>{{STEP_1}}</li>\n' +
      '  <li>{{STEP_2}}</li>\n' +
      '  <li>{{STEP_3}}</li>\n' +
      '</ol>\n' +
      '\n' +
      '<h3>Expected Behavior</h3>\n' +
      '<p>{{EXPECTED}}</p>\n' +
      '\n' +
      '<h3>Actual Behavior</h3>\n' +
      '<p>{{ACTUAL}}</p>\n' +
      '\n' +
      '<h3>Environment</h3>\n' +
      '<p>{{ENVIRONMENT}}</p>\n' +
      '\n' +
      '<h3>Screenshots/Logs</h3>\n' +
      '<p>{{ATTACHMENTS}}</p>',
  },

  // PERSONAL
  {
    id: 'shopping-list',
    name: 'Shopping List',
    icon: '🛒',
    category: TemplateCategory.PERSONAL,
    description: 'Grocery checklist',
    isChecklistTemplate: true,
    content: '',
    checklistItems: [
      { text: 'Milk', completed: false },
      { text: 'Eggs', completed: false },
      { text: 'Bread', completed: false },
      { text: 'Fruits & Vegetables', completed: false },
      { text: 'Meat & Protein', completed: false },
      { text: 'Snacks', completed: false },
      { text: 'Beverages', completed: false },
      { text: 'Household Items', completed: false },
    ],
  },
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    icon: '📖',
    category: TemplateCategory.PERSONAL,
    description: 'Daily reflection and journaling',
    content: '<h2>Daily Journal</h2>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '\n' +
      '<h3>How I\'m Feeling</h3>\n' +
      '<p>{{MOOD}}</p>\n' +
      '\n' +
      '<h3>Today\'s Highlights</h3>\n' +
      '<p>{{HIGHLIGHTS}}</p>\n' +
      '\n' +
      '<h3>Challenges</h3>\n' +
      '<p>{{CHALLENGES}}</p>\n' +
      '\n' +
      '<h3>Grateful For</h3>\n' +
      '<ul>\n' +
      '  <li></li>\n' +
      '  <li></li>\n' +
      '  <li></li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Tomorrow\'s Goals</h3>\n' +
      '<ul>\n' +
      '  <li></li>\n' +
      '  <li></li>\n' +
      '</ul>',
  },
  {
    id: 'travel-plan',
    name: 'Travel Plan',
    icon: '✈️',
    category: TemplateCategory.PERSONAL,
    description: 'Trip planning template',
    hasSmartFields: true,
    content: '<h2>Travel Plan</h2>\n' +
      '<p><strong>Destination:</strong> {{DESTINATION}}</p>\n' +
      '<p><strong>Dates:</strong> {{DATES}}</p>\n' +
      '<p><strong>Budget:</strong> {{BUDGET}}</p>\n' +
      '\n' +
      '<h3>Flight Details</h3>\n' +
      '<p>{{FLIGHT_INFO}}</p>\n' +
      '\n' +
      '<h3>Accommodation</h3>\n' +
      '<p>{{ACCOMMODATION}}</p>\n' +
      '\n' +
      '<h3>Itinerary</h3>\n' +
      '<p><strong>Day 1:</strong> {{DAY_1}}</p>\n' +
      '<p><strong>Day 2:</strong> {{DAY_2}}</p>\n' +
      '<p><strong>Day 3:</strong> {{DAY_3}}</p>\n' +
      '\n' +
      '<h3>Packing List</h3>\n' +
      '<ul>\n' +
      '  <li>Passport/ID</li>\n' +
      '  <li>Tickets</li>\n' +
      '  <li>Clothes</li>\n' +
      '  <li>Toiletries</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Important Contacts</h3>\n' +
      '<p>{{CONTACTS}}</p>',
  },
  {
    id: 'packing-list',
    name: 'Packing List',
    icon: '🧳',
    category: TemplateCategory.PERSONAL,
    description: 'Travel packing checklist',
    isChecklistTemplate: true,
    content: '',
    checklistItems: [
      { text: 'Passport/ID', completed: false },
      { text: 'Tickets & Reservations', completed: false },
      { text: 'Phone Charger', completed: false },
      { text: 'Toiletries', completed: false },
      { text: 'Medications', completed: false },
      { text: 'Clothes (underwear, socks)', completed: false },
      { text: 'Outerwear/Jacket', completed: false },
      { text: 'Shoes', completed: false },
      { text: 'Sunglasses', completed: false },
      { text: 'Camera', completed: false },
      { text: 'Books/Entertainment', completed: false },
      { text: 'Snacks', completed: false },
    ],
  },

  // WORK
  {
    id: 'weekly-report',
    name: 'Weekly Report',
    icon: '📊',
    category: TemplateCategory.WORK,
    description: 'Weekly progress report',
    hasSmartFields: true,
    content: '<h2>Weekly Report</h2>\n' +
      '<p><strong>Week of:</strong> {{WEEK_DATE}}</p>\n' +
      '<p><strong>Team/Department:</strong> {{TEAM}}</p>\n' +
      '\n' +
      '<h3>Accomplishments</h3>\n' +
      '<ul>\n' +
      '  <li>{{ACCOMPLISHMENT_1}}</li>\n' +
      '  <li>{{ACCOMPLISHMENT_2}}</li>\n' +
      '  <li>{{ACCOMPLISHMENT_3}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Key Metrics</h3>\n' +
      '<p>{{METRICS}}</p>\n' +
      '\n' +
      '<h3>Challenges & Blockers</h3>\n' +
      '<p>{{CHALLENGES}}</p>\n' +
      '\n' +
      '<h3>Next Week\'s Focus</h3>\n' +
      '<ul>\n' +
      '  <li>{{FOCUS_1}}</li>\n' +
      '  <li>{{FOCUS_2}}</li>\n' +
      '</ul>',
  },
  {
    id: 'interview-notes',
    name: 'Interview Notes',
    icon: '💼',
    category: TemplateCategory.WORK,
    description: 'Job interview preparation',
    hasSmartFields: true,
    content: '<h2>Interview Notes</h2>\n' +
      '<p><strong>Company:</strong> {{COMPANY}}</p>\n' +
      '<p><strong>Position:</strong> {{POSITION}}</p>\n' +
      '<p><strong>Date & Time:</strong> {{DATETIME}}</p>\n' +
      '<p><strong>Interviewer:</strong> {{INTERVIEWER}}</p>\n' +
      '\n' +
      '<h3>Company Research</h3>\n' +
      '<p>{{RESEARCH}}</p>\n' +
      '\n' +
      '<h3>Key Skills to Highlight</h3>\n' +
      '<ul>\n' +
      '  <li>{{SKILL_1}}</li>\n' +
      '  <li>{{SKILL_2}}</li>\n' +
      '  <li>{{SKILL_3}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Questions to Ask</h3>\n' +
      '<ul>\n' +
      '  <li>{{QUESTION_1}}</li>\n' +
      '  <li>{{QUESTION_2}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Interview Notes</h3>\n' +
      '<p>{{NOTES}}</p>\n' +
      '\n' +
      '<h3>Follow-up Actions</h3>\n' +
      '<p>{{FOLLOWUP}}</p>',
  },
  {
    id: 'one-on-one',
    name: '1:1 Meeting',
    icon: '👥',
    category: TemplateCategory.WORK,
    description: 'One-on-one meeting notes',
    hasSmartFields: true,
    content: '<h2>1:1 Meeting Notes</h2>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '<p><strong>With:</strong> {{PERSON}}</p>\n' +
      '\n' +
      '<h3>Discussion Topics</h3>\n' +
      '<ul>\n' +
      '  <li>{{TOPIC_1}}</li>\n' +
      '  <li>{{TOPIC_2}}</li>\n' +
      '  <li>{{TOPIC_3}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Wins & Successes</h3>\n' +
      '<p>{{WINS}}</p>\n' +
      '\n' +
      '<h3>Challenges</h3>\n' +
      '<p>{{CHALLENGES}}</p>\n' +
      '\n' +
      '<h3>Career Development</h3>\n' +
      '<p>{{CAREER}}</p>\n' +
      '\n' +
      '<h3>Action Items</h3>\n' +
      '<ul>\n' +
      '  <li>{{ACTION_1}}</li>\n' +
      '  <li>{{ACTION_2}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Next Meeting Date</h3>\n' +
      '<p>{{NEXT_MEETING}}</p>',
  },
  {
    id: 'client-brief',
    name: 'Client Brief',
    icon: '📋',
    category: TemplateCategory.WORK,
    description: 'Client project brief',
    hasSmartFields: true,
    content: '<h2>Client Brief</h2>\n' +
      '<p><strong>Client:</strong> {{CLIENT}}</p>\n' +
      '<p><strong>Project:</strong> {{PROJECT}}</p>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '\n' +
      '<h3>Project Overview</h3>\n' +
      '<p>{{OVERVIEW}}</p>\n' +
      '\n' +
      '<h3>Objectives</h3>\n' +
      '<ul>\n' +
      '  <li>{{OBJECTIVE_1}}</li>\n' +
      '  <li>{{OBJECTIVE_2}}</li>\n' +
      '  <li>{{OBJECTIVE_3}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Target Audience</h3>\n' +
      '<p>{{AUDIENCE}}</p>\n' +
      '\n' +
      '<h3>Deliverables</h3>\n' +
      '<p>{{DELIVERABLES}}</p>\n' +
      '\n' +
      '<h3>Timeline</h3>\n' +
      '<p>Start: {{START_DATE}}</p>\n' +
      '<p>Deadline: {{DEADLINE}}</p>\n' +
      '\n' +
      '<h3>Budget</h3>\n' +
      '<p>{{BUDGET}}</p>\n' +
      '\n' +
      '<h3>Key Contacts</h3>\n' +
      '<p>{{CONTACTS}}</p>',
  },

  // CREATIVE
  {
    id: 'blog-post',
    name: 'Blog Post',
    icon: '✍️',
    category: TemplateCategory.CREATIVE,
    description: 'Blog post outline',
    hasSmartFields: true,
    content: '<h2>Blog Post Draft</h2>\n' +
      '<p><strong>Title:</strong> {{TITLE}}</p>\n' +
      '<p><strong>Target Audience:</strong> {{AUDIENCE}}</p>\n' +
      '<p><strong>Keywords:</strong> {{KEYWORDS}}</p>\n' +
      '\n' +
      '<h3>Introduction</h3>\n' +
      '<p>{{INTRO}}</p>\n' +
      '\n' +
      '<h3>Main Points</h3>\n' +
      '<p><strong>Point 1:</strong> {{POINT_1}}</p>\n' +
      '<p><strong>Point 2:</strong> {{POINT_2}}</p>\n' +
      '<p><strong>Point 3:</strong> {{POINT_3}}</p>\n' +
      '\n' +
      '<h3>Conclusion</h3>\n' +
      '<p>{{CONCLUSION}}</p>\n' +
      '\n' +
      '<h3>Call to Action</h3>\n' +
      '<p>{{CTA}}</p>',
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    icon: '💡',
    category: TemplateCategory.CREATIVE,
    description: 'Creative brainstorming',
    content: '<h2>Brainstorm Session</h2>\n' +
      '<p><strong>Topic:</strong> {{TOPIC}}</p>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '\n' +
      '<h3>Problem/Challenge</h3>\n' +
      '<p>{{PROBLEM}}</p>\n' +
      '\n' +
      '<h3>Ideas</h3>\n' +
      '<ul>\n' +
      '  <li>Idea 1</li>\n' +
      '  <li>Idea 2</li>\n' +
      '  <li>Idea 3</li>\n' +
      '  <li>Idea 4</li>\n' +
      '  <li>Idea 5</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Best Ideas</h3>\n' +
      '<p>{{BEST_IDEAS}}</p>\n' +
      '\n' +
      '<h3>Next Steps</h3>\n' +
      '<p>{{NEXT_STEPS}}</p>',
  },
  {
    id: 'video-script',
    name: 'Video Script',
    icon: '🎬',
    category: TemplateCategory.CREATIVE,
    description: 'YouTube/video content script',
    hasSmartFields: true,
    content: '<h2>Video Script</h2>\n' +
      '<p><strong>Title:</strong> {{TITLE}}</p>\n' +
      '<p><strong>Duration:</strong> {{DURATION}}</p>\n' +
      '<p><strong>Target Audience:</strong> {{AUDIENCE}}</p>\n' +
      '\n' +
      '<h3>Hook (First 10 seconds)</h3>\n' +
      '<p>{{HOOK}}</p>\n' +
      '\n' +
      '<h3>Introduction</h3>\n' +
      '<p>{{INTRO}}</p>\n' +
      '\n' +
      '<h3>Main Content</h3>\n' +
      '<p><strong>Section 1:</strong> {{SECTION_1}}</p>\n' +
      '<p><strong>Section 2:</strong> {{SECTION_2}}</p>\n' +
      '<p><strong>Section 3:</strong> {{SECTION_3}}</p>\n' +
      '\n' +
      '<h3>Call to Action</h3>\n' +
      '<p>{{CTA}}</p>\n' +
      '\n' +
      '<h3>Outro</h3>\n' +
      '<p>{{OUTRO}}</p>\n' +
      '\n' +
      '<h3>B-Roll Ideas</h3>\n' +
      '<p>{{BROLL}}</p>',
  },
  {
    id: 'character-profile',
    name: 'Character Profile',
    icon: '🎭',
    category: TemplateCategory.CREATIVE,
    description: 'Story character development',
    hasSmartFields: true,
    content: '<h2>Character Profile</h2>\n' +
      '<p><strong>Name:</strong> {{NAME}}</p>\n' +
      '<p><strong>Age:</strong> {{AGE}}</p>\n' +
      '<p><strong>Role:</strong> {{ROLE}}</p>\n' +
      '\n' +
      '<h3>Physical Description</h3>\n' +
      '<p>{{APPEARANCE}}</p>\n' +
      '\n' +
      '<h3>Personality</h3>\n' +
      '<p>{{PERSONALITY}}</p>\n' +
      '\n' +
      '<h3>Background/History</h3>\n' +
      '<p>{{BACKGROUND}}</p>\n' +
      '\n' +
      '<h3>Motivations</h3>\n' +
      '<p>{{MOTIVATIONS}}</p>\n' +
      '\n' +
      '<h3>Strengths</h3>\n' +
      '<p>{{STRENGTHS}}</p>\n' +
      '\n' +
      '<h3>Weaknesses/Flaws</h3>\n' +
      '<p>{{FLAWS}}</p>\n' +
      '\n' +
      '<h3>Relationships</h3>\n' +
      '<p>{{RELATIONSHIPS}}</p>\n' +
      '\n' +
      '<h3>Character Arc</h3>\n' +
      '<p>{{ARC}}</p>',
  },
  {
    id: 'social-media-plan',
    name: 'Social Media Plan',
    icon: '📱',
    category: TemplateCategory.CREATIVE,
    description: 'Content calendar & strategy',
    hasSmartFields: true,
    content: '<h2>Social Media Content Plan</h2>\n' +
      '<p><strong>Platform:</strong> {{PLATFORM}}</p>\n' +
      '<p><strong>Week of:</strong> {{WEEK_DATE}}</p>\n' +
      '\n' +
      '<h3>Content Theme</h3>\n' +
      '<p>{{THEME}}</p>\n' +
      '\n' +
      '<h3>Monday</h3>\n' +
      '<p>Post: {{MON_POST}}</p>\n' +
      '<p>Time: {{MON_TIME}}</p>\n' +
      '\n' +
      '<h3>Wednesday</h3>\n' +
      '<p>Post: {{WED_POST}}</p>\n' +
      '<p>Time: {{WED_TIME}}</p>\n' +
      '\n' +
      '<h3>Friday</h3>\n' +
      '<p>Post: {{FRI_POST}}</p>\n' +
      '<p>Time: {{FRI_TIME}}</p>\n' +
      '\n' +
      '<h3>Hashtags</h3>\n' +
      '<p>{{HASHTAGS}}</p>\n' +
      '\n' +
      '<h3>Engagement Goals</h3>\n' +
      '<p>{{GOALS}}</p>',
  },

  // EDUCATION
  {
    id: 'study-notes',
    name: 'Study Notes',
    icon: '📚',
    category: TemplateCategory.EDUCATION,
    description: 'Organized study notes',
    hasSmartFields: true,
    content: '<h2>Study Notes</h2>\n' +
      '<p><strong>Subject:</strong> {{SUBJECT}}</p>\n' +
      '<p><strong>Topic:</strong> {{TOPIC}}</p>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '\n' +
      '<h3>Key Concepts</h3>\n' +
      '<ul>\n' +
      '  <li>{{CONCEPT_1}}</li>\n' +
      '  <li>{{CONCEPT_2}}</li>\n' +
      '  <li>{{CONCEPT_3}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Definitions</h3>\n' +
      '<p>{{DEFINITIONS}}</p>\n' +
      '\n' +
      '<h3>Examples</h3>\n' +
      '<p>{{EXAMPLES}}</p>\n' +
      '\n' +
      '<h3>Questions</h3>\n' +
      '<ul>\n' +
      '  <li>{{QUESTION_1}}</li>\n' +
      '  <li>{{QUESTION_2}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Summary</h3>\n' +
      '<p>{{SUMMARY}}</p>',
  },
  {
    id: 'book-notes',
    name: 'Book Notes',
    icon: '📕',
    category: TemplateCategory.EDUCATION,
    description: 'Book reading notes',
    hasSmartFields: true,
    content: '<h2>Book Notes</h2>\n' +
      '<p><strong>Title:</strong> {{TITLE}}</p>\n' +
      '<p><strong>Author:</strong> {{AUTHOR}}</p>\n' +
      '<p><strong>Date Started:</strong> {{DATE}}</p>\n' +
      '\n' +
      '<h3>Main Themes</h3>\n' +
      '<p>{{THEMES}}</p>\n' +
      '\n' +
      '<h3>Key Takeaways</h3>\n' +
      '<ul>\n' +
      '  <li>{{TAKEAWAY_1}}</li>\n' +
      '  <li>{{TAKEAWAY_2}}</li>\n' +
      '  <li>{{TAKEAWAY_3}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Favorite Quotes</h3>\n' +
      '<p>{{QUOTES}}</p>\n' +
      '\n' +
      '<h3>Personal Reflection</h3>\n' +
      '<p>{{REFLECTION}}</p>\n' +
      '\n' +
      '<h3>Rating</h3>\n' +
      '<p>⭐ / 5</p>',
  },
  {
    id: 'lecture-notes',
    name: 'Lecture Notes',
    icon: '🎓',
    category: TemplateCategory.EDUCATION,
    description: 'Class lecture notes',
    hasSmartFields: true,
    content: '<h2>Lecture Notes</h2>\n' +
      '<p><strong>Course:</strong> {{COURSE}}</p>\n' +
      '<p><strong>Topic:</strong> {{TOPIC}}</p>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '<p><strong>Professor:</strong> {{PROFESSOR}}</p>\n' +
      '\n' +
      '<h3>Key Points</h3>\n' +
      '<ul>\n' +
      '  <li>{{POINT_1}}</li>\n' +
      '  <li>{{POINT_2}}</li>\n' +
      '  <li>{{POINT_3}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Detailed Notes</h3>\n' +
      '<p>{{NOTES}}</p>\n' +
      '\n' +
      '<h3>Important Terms</h3>\n' +
      '<p>{{TERMS}}</p>\n' +
      '\n' +
      '<h3>Questions for Review</h3>\n' +
      '<ul>\n' +
      '  <li>{{QUESTION_1}}</li>\n' +
      '  <li>{{QUESTION_2}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Reading Assignment</h3>\n' +
      '<p>{{READING}}</p>',
  },
  {
    id: 'exam-prep',
    name: 'Exam Preparation',
    icon: '📝',
    category: TemplateCategory.EDUCATION,
    description: 'Exam study guide',
    hasSmartFields: true,
    content: '<h2>Exam Preparation</h2>\n' +
      '<p><strong>Subject:</strong> {{SUBJECT}}</p>\n' +
      '<p><strong>Exam Date:</strong> {{EXAM_DATE}}</p>\n' +
      '<p><strong>Type:</strong> {{EXAM_TYPE}}</p>\n' +
      '\n' +
      '<h3>Topics to Review</h3>\n' +
      '<ul>\n' +
      '  <li>{{TOPIC_1}}</li>\n' +
      '  <li>{{TOPIC_2}}</li>\n' +
      '  <li>{{TOPIC_3}}</li>\n' +
      '  <li>{{TOPIC_4}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Key Formulas/Concepts</h3>\n' +
      '<p>{{FORMULAS}}</p>\n' +
      '\n' +
      '<h3>Practice Problems</h3>\n' +
      '<p>{{PROBLEMS}}</p>\n' +
      '\n' +
      '<h3>Study Schedule</h3>\n' +
      '<p>{{SCHEDULE}}</p>\n' +
      '\n' +
      '<h3>Resources</h3>\n' +
      '<p>{{RESOURCES}}</p>',
  },

  // HEALTH & FITNESS
  {
    id: 'workout-log',
    name: 'Workout Log',
    icon: '💪',
    category: TemplateCategory.HEALTH,
    description: 'Track your fitness journey',
    content: '<h2>Workout Log</h2>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '<p><strong>Duration:</strong> {{DURATION}}</p>\n' +
      '\n' +
      '<h3>Warm-up</h3>\n' +
      '<p>{{WARMUP}}</p>\n' +
      '\n' +
      '<h3>Exercises</h3>\n' +
      '<p><strong>Exercise 1:</strong> Sets × Reps × Weight</p>\n' +
      '<p><strong>Exercise 2:</strong> Sets × Reps × Weight</p>\n' +
      '<p><strong>Exercise 3:</strong> Sets × Reps × Weight</p>\n' +
      '\n' +
      '<h3>Cardio</h3>\n' +
      '<p>{{CARDIO}}</p>\n' +
      '\n' +
      '<h3>Cool Down</h3>\n' +
      '<p>{{COOLDOWN}}</p>\n' +
      '\n' +
      '<h3>Notes</h3>\n' +
      '<p>Energy level: ⭐⭐⭐⭐⭐</p>\n' +
      '<p>{{NOTES}}</p>',
  },
  {
    id: 'meal-plan',
    name: 'Meal Planner',
    icon: '🍽️',
    category: TemplateCategory.HEALTH,
    description: 'Weekly meal planning',
    content: '<h2>Weekly Meal Plan</h2>\n' +
      '<p><strong>Week of:</strong> {{DATE}}</p>\n' +
      '\n' +
      '<h3>Monday</h3>\n' +
      '<ul>\n' +
      '  <li>Breakfast: </li>\n' +
      '  <li>Lunch: </li>\n' +
      '  <li>Dinner: </li>\n' +
      '  <li>Snacks: </li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Tuesday</h3>\n' +
      '<ul>\n' +
      '  <li>Breakfast: </li>\n' +
      '  <li>Lunch: </li>\n' +
      '  <li>Dinner: </li>\n' +
      '  <li>Snacks: </li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Wednesday</h3>\n' +
      '<ul>\n' +
      '  <li>Breakfast: </li>\n' +
      '  <li>Lunch: </li>\n' +
      '  <li>Dinner: </li>\n' +
      '  <li>Snacks: </li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Grocery List</h3>\n' +
      '<ul>\n' +
      '  <li></li>\n' +
      '</ul>',
  },
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    icon: '✓',
    category: TemplateCategory.HEALTH,
    description: 'Build better habits',
    content: '<h2>Habit Tracker</h2>\n' +
      '<p><strong>Month:</strong> {{MONTH}}</p>\n' +
      '\n' +
      '<h3>Habits to Track</h3>\n' +
      '<ol>\n' +
      '  <li>{{HABIT_1}}</li>\n' +
      '  <li>{{HABIT_2}}</li>\n' +
      '  <li>{{HABIT_3}}</li>\n' +
      '  <li>{{HABIT_4}}</li>\n' +
      '  <li>{{HABIT_5}}</li>\n' +
      '</ol>\n' +
      '\n' +
      '<h3>Week 1 Progress</h3>\n' +
      '<p>Mon [ ] Tue [ ] Wed [ ] Thu [ ] Fri [ ] Sat [ ] Sun [ ]</p>\n' +
      '\n' +
      '<h3>Week 2 Progress</h3>\n' +
      '<p>Mon [ ] Tue [ ] Wed [ ] Thu [ ] Fri [ ] Sat [ ] Sun [ ]</p>\n' +
      '\n' +
      '<h3>Notes & Reflections</h3>\n' +
      '<p>{{NOTES}}</p>\n' +
      '\n' +
      '<h3>Wins This Month</h3>\n' +
      '<p>{{WINS}}</p>',
  },
  {
    id: 'recipe',
    name: 'Recipe',
    icon: '👨‍🍳',
    category: TemplateCategory.HEALTH,
    description: 'Save your favorite recipes',
    content: '<h2>Recipe: {{RECIPE_NAME}}</h2>\n' +
      '\n' +
      '<p><strong>Prep Time:</strong> {{PREP_TIME}}</p>\n' +
      '<p><strong>Cook Time:</strong> {{COOK_TIME}}</p>\n' +
      '<p><strong>Servings:</strong> {{SERVINGS}}</p>\n' +
      '\n' +
      '<h3>Ingredients</h3>\n' +
      '<ul>\n' +
      '  <li></li>\n' +
      '  <li></li>\n' +
      '  <li></li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Instructions</h3>\n' +
      '<ol>\n' +
      '  <li></li>\n' +
      '  <li></li>\n' +
      '  <li></li>\n' +
      '</ol>\n' +
      '\n' +
      '<h3>Notes</h3>\n' +
      '<p>{{NOTES}}</p>\n' +
      '\n' +
      '<h3>Rating</h3>\n' +
      '<p>⭐⭐⭐⭐⭐</p>',
  },
  {
    id: 'fitness-goals',
    name: 'Fitness Goals',
    icon: '🎯',
    category: TemplateCategory.HEALTH,
    description: 'Track fitness objectives',
    hasSmartFields: true,
    content: '<h2>Fitness Goals</h2>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '<p><strong>Timeline:</strong> {{TIMELINE}}</p>\n' +
      '\n' +
      '<h3>Main Goal</h3>\n' +
      '<p>{{MAIN_GOAL}}</p>\n' +
      '\n' +
      '<h3>Current Stats</h3>\n' +
      '<p>Weight: {{CURRENT_WEIGHT}}</p>\n' +
      '<p>Body Fat: {{CURRENT_BF}}%</p>\n' +
      '<p>Measurements: {{CURRENT_MEASUREMENTS}}</p>\n' +
      '\n' +
      '<h3>Target Stats</h3>\n' +
      '<p>Weight: {{TARGET_WEIGHT}}</p>\n' +
      '<p>Body Fat: {{TARGET_BF}}%</p>\n' +
      '<p>Measurements: {{TARGET_MEASUREMENTS}}</p>\n' +
      '\n' +
      '<h3>Workout Plan</h3>\n' +
      '<p>{{WORKOUT_PLAN}}</p>\n' +
      '\n' +
      '<h3>Nutrition Plan</h3>\n' +
      '<p>Calories: {{CALORIES}}</p>\n' +
      '<p>Macros: {{MACROS}}</p>\n' +
      '\n' +
      '<h3>Progress Tracking</h3>\n' +
      '<p>Weekly check-in: {{CHECK_IN}}</p>',
  },
  {
    id: 'water-tracker',
    name: 'Daily Water Intake',
    icon: '💧',
    category: TemplateCategory.HEALTH,
    description: 'Track hydration goals',
    isChecklistTemplate: true,
    content: '',
    checklistItems: [
      { text: 'Morning (6-9 AM) - Glass 1', completed: false },
      { text: 'Morning (9-12 PM) - Glass 2', completed: false },
      { text: 'Lunch (12-1 PM) - Glass 3', completed: false },
      { text: 'Afternoon (1-3 PM) - Glass 4', completed: false },
      { text: 'Afternoon (3-6 PM) - Glass 5', completed: false },
      { text: 'Evening (6-8 PM) - Glass 6', completed: false },
      { text: 'Evening (8-10 PM) - Glass 7', completed: false },
      { text: 'Before Bed - Glass 8', completed: false },
    ],
  },

  // FINANCE
  {
    id: 'budget-tracker',
    name: 'Budget Tracker',
    icon: '💰',
    category: TemplateCategory.FINANCE,
    description: 'Monthly budget planning',
    hasSmartFields: true,
    content: '<h2>Monthly Budget</h2>\n' +
      '<p><strong>Month:</strong> {{MONTH}}</p>\n' +
      '<p><strong>Total Income:</strong> ${{INCOME}}</p>\n' +
      '\n' +
      '<h3>Fixed Expenses</h3>\n' +
      '<ul>\n' +
      '  <li>Rent/Mortgage: $</li>\n' +
      '  <li>Utilities: $</li>\n' +
      '  <li>Insurance: $</li>\n' +
      '  <li>Transportation: $</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Variable Expenses</h3>\n' +
      '<ul>\n' +
      '  <li>Groceries: $</li>\n' +
      '  <li>Dining Out: $</li>\n' +
      '  <li>Entertainment: $</li>\n' +
      '  <li>Shopping: $</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Savings & Investments</h3>\n' +
      '<p>Emergency Fund: $</p>\n' +
      '<p>Retirement: $</p>\n' +
      '<p>Other: $</p>\n' +
      '\n' +
      '<h3>Summary</h3>\n' +
      '<p>Total Expenses: $</p>\n' +
      '<p>Remaining: $</p>',
  },
  {
    id: 'expense-tracker',
    name: 'Expense Log',
    icon: '📊',
    category: TemplateCategory.FINANCE,
    description: 'Daily expense tracking',
    content: '<h2>Expense Log</h2>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '\n' +
      '<h3>Today\'s Expenses</h3>\n' +
      '<ul>\n' +
      '  <li>Amount: $ | Category: | Description: </li>\n' +
      '  <li>Amount: $ | Category: | Description: </li>\n' +
      '  <li>Amount: $ | Category: | Description: </li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Categories</h3>\n' +
      '<p>🍔 Food: $</p>\n' +
      '<p>🚗 Transport: $</p>\n' +
      '<p>🎭 Entertainment: $</p>\n' +
      '<p>🏪 Shopping: $</p>\n' +
      '<p>💊 Health: $</p>\n' +
      '\n' +
      '<h3>Total Spent Today</h3>\n' +
      '<p>$</p>',
  },
  {
    id: 'savings-goals',
    name: 'Savings Goals',
    icon: '🎯',
    category: TemplateCategory.FINANCE,
    description: 'Track savings progress',
    hasSmartFields: true,
    content: '<h2>Savings Goals</h2>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '\n' +
      '<h3>Goal 1: {{GOAL_1}}</h3>\n' +
      '<p>Target Amount: ${{TARGET_1}}</p>\n' +
      '<p>Current Savings: $</p>\n' +
      '<p>Deadline: {{DEADLINE_1}}</p>\n' +
      '<p>Progress: [ ████░░░░░░ ] %</p>\n' +
      '\n' +
      '<h3>Goal 2: {{GOAL_2}}</h3>\n' +
      '<p>Target Amount: ${{TARGET_2}}</p>\n' +
      '<p>Current Savings: $</p>\n' +
      '<p>Deadline: {{DEADLINE_2}}</p>\n' +
      '<p>Progress: [ ████░░░░░░ ] %</p>\n' +
      '\n' +
      '<h3>Monthly Contributions</h3>\n' +
      '<p>Goal 1: $</p>\n' +
      '<p>Goal 2: $</p>\n' +
      '\n' +
      '<h3>Notes</h3>\n' +
      '<p>{{NOTES}}</p>',
  },
  {
    id: 'investment-tracker',
    name: 'Investment Portfolio',
    icon: '💹',
    category: TemplateCategory.FINANCE,
    description: 'Track investments & returns',
    hasSmartFields: true,
    content: '<h2>Investment Portfolio</h2>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '\n' +
      '<h3>Portfolio Summary</h3>\n' +
      '<p>Total Value: ${{TOTAL_VALUE}}</p>\n' +
      '<p>Total Invested: ${{TOTAL_INVESTED}}</p>\n' +
      '<p>Gain/Loss: {{GAIN_LOSS}}%</p>\n' +
      '\n' +
      '<h3>Asset Allocation</h3>\n' +
      '<p>Stocks: {{STOCKS}}%</p>\n' +
      '<p>Bonds: {{BONDS}}%</p>\n' +
      '<p>Cash: {{CASH}}%</p>\n' +
      '<p>Real Estate: {{REAL_ESTATE}}%</p>\n' +
      '<p>Crypto: {{CRYPTO}}%</p>\n' +
      '\n' +
      '<h3>Top Holdings</h3>\n' +
      '<ul>\n' +
      '  <li>{{HOLDING_1}}</li>\n' +
      '  <li>{{HOLDING_2}}</li>\n' +
      '  <li>{{HOLDING_3}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Recent Transactions</h3>\n' +
      '<p>{{TRANSACTIONS}}</p>\n' +
      '\n' +
      '<h3>Goals & Strategy</h3>\n' +
      '<p>{{STRATEGY}}</p>',
  },

  // EVENTS
  {
    id: 'event-planning',
    name: 'Event Planner',
    icon: '🎉',
    category: TemplateCategory.EVENTS,
    description: 'Plan any event perfectly',
    hasSmartFields: true,
    content: '<h2>Event Planning</h2>\n' +
      '<p><strong>Event Name:</strong> {{EVENT_NAME}}</p>\n' +
      '<p><strong>Date & Time:</strong> {{DATETIME}}</p>\n' +
      '<p><strong>Venue:</strong> {{VENUE}}</p>\n' +
      '<p><strong>Number of Guests:</strong> {{GUESTS}}</p>\n' +
      '\n' +
      '<h3>Budget</h3>\n' +
      '<p>Total Budget: ${{BUDGET}}</p>\n' +
      '<p>Venue: $</p>\n' +
      '<p>Catering: $</p>\n' +
      '<p>Decorations: $</p>\n' +
      '<p>Entertainment: $</p>\n' +
      '\n' +
      '<h3>Guest List</h3>\n' +
      '<p>{{GUEST_LIST}}</p>\n' +
      '\n' +
      '<h3>To-Do Checklist</h3>\n' +
      '<ul>\n' +
      '  <li>Book venue</li>\n' +
      '  <li>Send invitations</li>\n' +
      '  <li>Order catering</li>\n' +
      '  <li>Arrange decorations</li>\n' +
      '  <li>Plan activities</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Timeline</h3>\n' +
      '<p>{{TIMELINE}}</p>\n' +
      '\n' +
      '<h3>Notes</h3>\n' +
      '<p>{{NOTES}}</p>',
  },
  {
    id: 'birthday-party',
    name: 'Birthday Party',
    icon: '🎂',
    category: TemplateCategory.EVENTS,
    description: 'Birthday celebration planner',
    hasSmartFields: true,
    content: '<h2>Birthday Party Plan</h2>\n' +
      '<p><strong>Birthday Person:</strong> {{NAME}}</p>\n' +
      '<p><strong>Age:</strong> {{AGE}}</p>\n' +
      '<p><strong>Date & Time:</strong> {{DATETIME}}</p>\n' +
      '<p><strong>Theme:</strong> {{THEME}}</p>\n' +
      '\n' +
      '<h3>Guest List ({{GUEST_COUNT}} guests)</h3>\n' +
      '<p>{{GUESTS}}</p>\n' +
      '\n' +
      '<h3>Party Activities</h3>\n' +
      '<ul>\n' +
      '  <li>Games: {{GAMES}}</li>\n' +
      '  <li>Entertainment: {{ENTERTAINMENT}}</li>\n' +
      '  <li>Music playlist</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Food & Cake</h3>\n' +
      '<p>Cake flavor: {{CAKE}}</p>\n' +
      '<p>Snacks & appetizers:</p>\n' +
      '<ul>\n' +
      '  <li></li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Decorations</h3>\n' +
      '<ul>\n' +
      '  <li>Balloons</li>\n' +
      '  <li>Banners</li>\n' +
      '  <li>Table settings</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Shopping List</h3>\n' +
      '<p>{{SHOPPING}}</p>\n' +
      '\n' +
      '<h3>Budget</h3>\n' +
      '<p>Total: $</p>',
  },
  {
    id: 'wedding-planning',
    name: 'Wedding Planner',
    icon: '💍',
    category: TemplateCategory.EVENTS,
    description: 'Complete wedding planning',
    hasSmartFields: true,
    content: '<h2>Wedding Planning</h2>\n' +
      '<p><strong>Couple:</strong> {{COUPLE_NAMES}}</p>\n' +
      '<p><strong>Wedding Date:</strong> {{WEDDING_DATE}}</p>\n' +
      '<p><strong>Venue:</strong> {{VENUE}}</p>\n' +
      '\n' +
      '<h3>Budget</h3>\n' +
      '<p>Total Budget: ${{BUDGET}}</p>\n' +
      '<p>Venue: $</p>\n' +
      '<p>Catering: $</p>\n' +
      '<p>Photography: $</p>\n' +
      '<p>Flowers: $</p>\n' +
      '<p>Music/DJ: $</p>\n' +
      '\n' +
      '<h3>Guest List</h3>\n' +
      '<p>Expected Guests: {{GUEST_COUNT}}</p>\n' +
      '<p>Confirmed: </p>\n' +
      '<p>Pending: </p>\n' +
      '\n' +
      '<h3>Vendor Contacts</h3>\n' +
      '<p>Photographer: {{PHOTOGRAPHER}}</p>\n' +
      '<p>Caterer: {{CATERER}}</p>\n' +
      '<p>Florist: {{FLORIST}}</p>\n' +
      '<p>DJ/Band: {{DJ}}</p>\n' +
      '\n' +
      '<h3>Timeline</h3>\n' +
      '<p>6 months before: {{TASK_6M}}</p>\n' +
      '<p>3 months before: {{TASK_3M}}</p>\n' +
      '<p>1 month before: {{TASK_1M}}</p>\n' +
      '<p>1 week before: {{TASK_1W}}</p>\n' +
      '\n' +
      '<h3>Notes</h3>\n' +
      '<p>{{NOTES}}</p>',
  },

  // PERSONAL (Additional)
  {
    id: 'goal-setting',
    name: 'Goal Setting',
    icon: '🎯',
    category: TemplateCategory.PERSONAL,
    description: 'Set and track personal goals',
    hasSmartFields: true,
    content: '<h2>Goal Setting</h2>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '<p><strong>Time Period:</strong> {{TIMEFRAME}}</p>\n' +
      '\n' +
      '<h3>My Main Goal</h3>\n' +
      '<p>{{MAIN_GOAL}}</p>\n' +
      '\n' +
      '<h3>Why This Goal Matters</h3>\n' +
      '<p>{{WHY}}</p>\n' +
      '\n' +
      '<h3>Action Steps</h3>\n' +
      '<ol>\n' +
      '  <li>{{STEP_1}}</li>\n' +
      '  <li>{{STEP_2}}</li>\n' +
      '  <li>{{STEP_3}}</li>\n' +
      '  <li>{{STEP_4}}</li>\n' +
      '</ol>\n' +
      '\n' +
      '<h3>Milestones</h3>\n' +
      '<ul>\n' +
      '  <li>Week 1: {{MILESTONE_1}}</li>\n' +
      '  <li>Week 2: {{MILESTONE_2}}</li>\n' +
      '  <li>Week 3: {{MILESTONE_3}}</li>\n' +
      '  <li>Week 4: {{MILESTONE_4}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Potential Obstacles</h3>\n' +
      '<p>{{OBSTACLES}}</p>\n' +
      '\n' +
      '<h3>How to Overcome Them</h3>\n' +
      '<p>{{SOLUTIONS}}</p>\n' +
      '\n' +
      '<h3>Progress Tracking</h3>\n' +
      '<p>{{PROGRESS}}</p>',
  },
  {
    id: 'gratitude-journal',
    name: 'Gratitude Journal',
    icon: '🙏',
    category: TemplateCategory.PERSONAL,
    description: 'Daily gratitude practice',
    content: '<h2>Gratitude Journal</h2>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '\n' +
      '<h3>Today I\'m Grateful For...</h3>\n' +
      '<ol>\n' +
      '  <li></li>\n' +
      '  <li></li>\n' +
      '  <li></li>\n' +
      '</ol>\n' +
      '\n' +
      '<h3>Someone Who Made My Day Better</h3>\n' +
      '<p>{{PERSON}}</p>\n' +
      '\n' +
      '<h3>A Small Win Today</h3>\n' +
      '<p>{{WIN}}</p>\n' +
      '\n' +
      '<h3>Something Beautiful I Noticed</h3>\n' +
      '<p>{{BEAUTY}}</p>\n' +
      '\n' +
      '<h3>What Made Me Smile</h3>\n' +
      '<p>{{SMILE}}</p>\n' +
      '\n' +
      '<h3>Positive Affirmation</h3>\n' +
      '<p>{{AFFIRMATION}}</p>',
  },

  // WORK (Additional)
  {
    id: 'performance-review',
    name: 'Performance Review',
    icon: '📈',
    category: TemplateCategory.WORK,
    description: 'Self-evaluation template',
    hasSmartFields: true,
    content: '<h2>Performance Review</h2>\n' +
      '<p><strong>Employee:</strong> {{NAME}}</p>\n' +
      '<p><strong>Review Period:</strong> {{PERIOD}}</p>\n' +
      '<p><strong>Date:</strong> {{DATE}}</p>\n' +
      '\n' +
      '<h3>Key Accomplishments</h3>\n' +
      '<ul>\n' +
      '  <li>{{ACCOMPLISHMENT_1}}</li>\n' +
      '  <li>{{ACCOMPLISHMENT_2}}</li>\n' +
      '  <li>{{ACCOMPLISHMENT_3}}</li>\n' +
      '</ul>\n' +
      '\n' +
      '<h3>Goals Achieved</h3>\n' +
      '<p>{{GOALS_ACHIEVED}}</p>\n' +
      '\n' +
      '<h3>Areas of Strength</h3>\n' +
      '<p>{{STRENGTHS}}</p>\n' +
      '\n' +
      '<h3>Areas for Improvement</h3>\n' +
      '<p>{{IMPROVEMENTS}}</p>\n' +
      '\n' +
      '<h3>Goals for Next Period</h3>\n' +
      '<ol>\n' +
      '  <li>{{NEXT_GOAL_1}}</li>\n' +
      '  <li>{{NEXT_GOAL_2}}</li>\n' +
      '  <li>{{NEXT_GOAL_3}}</li>\n' +
      '</ol>\n' +
      '\n' +
      '<h3>Training & Development Needs</h3>\n' +
      '<p>{{TRAINING}}</p>\n' +
      '\n' +
      '<h3>Additional Comments</h3>\n' +
      '<p>{{COMMENTS}}</p>',
  },
];

// Helper to get templates by category
export function getTemplatesByCategory(category: TemplateCategory): NoteTemplate[] {
  return NOTE_TEMPLATES.filter(t => t.category === category);
}

// Helper to get template by ID
export function getTemplateById(id: string): NoteTemplate | undefined {
  return NOTE_TEMPLATES.find(t => t.id === id);
}

// Helper to replace placeholders with current date and remove other placeholders
export function fillTemplatePlaceholders(content: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const monthStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });

  // Replace DATE and MONTH placeholders with actual values
  let result = content.replace(/\{\{DATE\}\}/g, dateStr);
  result = result.replace(/\{\{MONTH\}\}/g, monthStr);

  // Remove all other placeholders (replace with empty string)
  // This prevents JavaScript evaluation errors
  result = result.replace(/\{\{[A-Z_0-9]+\}\}/g, '');

  return result;
}
