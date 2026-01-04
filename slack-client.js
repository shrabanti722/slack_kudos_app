// Shared Slack client instance
// This will be set by index.js when the app initializes
let slackClientInstance = null;

export function setSlackClient(client) {
  slackClientInstance = client;
}

export function getSlackClient() {
  if (!slackClientInstance) {
    throw new Error('Slack client not initialized. Make sure the Slack app is running.');
  }
  return slackClientInstance;
}

