const fullAccessTags = [
  'Enrolled_to_Membership',
  'Enrolled_Holistic Membership',
  'Enrolled_Swara Yoga Membership',
  'UPIPayerMonthly',
  'UPIPayerAnnual',
  'Order Bump - Monthly Holistic Membership',
];

const limitedAccessTags = {
  fullSleepMusicAccess: ['Enrolled_to_Sleep_Membership', 'Enrolled_to_Sleep_Membership', 'Purchased-9-Day-Breathwork course'],
  defaultSleepMusicAccess: ['Purchased-9-Day-Breathwork course', 'Purchased-9-Day-Meditation course'],
};

module.exports = {
  fullAccessTags,
  limitedAccessTags,
};
