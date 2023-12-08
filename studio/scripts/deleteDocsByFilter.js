import {createClient} from '@sanity/client'

const sanityClient = createClient({
  projectId: 'lvgeynh2',
  dataset: 'production',
  apiVersion: "2023-05-03",
  token: "skkqSnARLRLA9wD66DTEjlwwR9fthETzwjBlEKapLiu7LQIkv7EFyraD1xtrQbbJ9NdvHAfKWh8xXPf1RYxzMqXTiNmG8Ohd2qyTqGwZL4vxaC6EFyZB7gXUxXigGuaBK7paQeDfXLsOq1XX2tcYLdtnzF5YJa50UpkLgNss4Mhq8YiK9ths"
})

sanityClient
  .delete({query: '*[_type == "route" && references("1a9b09aa-8c5f-4dba-ab3a-3d0388df8461")]'})
  .then(console.log)
  .catch(console.error)