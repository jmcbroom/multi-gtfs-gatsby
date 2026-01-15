import {createClient} from '@sanity/client'

const sanityClient = createClient({
  projectId: 'lvgeynh2',
  dataset: 'production',
  apiVersion: "2023-05-03",
  token: process.env.SANITY_TOKEN
})

sanityClient
  .delete({query: '*[_type == "route" && references("1a9b09aa-8c5f-4dba-ab3a-3d0388df8461")]'})
  .then(console.log)
  .catch(console.error)