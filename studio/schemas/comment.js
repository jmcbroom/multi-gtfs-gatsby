export default {
  name: 'comment',
  title: 'Comment',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Name of the person who wrote the comment',
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Email of the person who wrote the comment',
    },
    {
      name: 'message',
      title: 'Message',
      type: 'text',
      description: 'The comment',
    },
  ],
};
