import Ably from "ably"

let ablyClient: Ably.Realtime | null = null

export function getAblyClient(): Ably.Realtime {
  if (!ablyClient) {
    ablyClient = new Ably.Realtime({
      authUrl: "/api/realtime/ably-auth",
      authMethod: "POST",
    })
  }
  return ablyClient
}

export function getChannel(channelName: string) {
  const client = getAblyClient()
  return client.channels.get(channelName)
}

export async function publishToChannel(channelName: string, eventName: string, data: any) {
  const channel = getChannel(channelName)
  await channel.publish(eventName, data)
}

export function subscribeToChannel(
  channelName: string,
  eventName: string,
  callback: (data: any) => void
) {
  const channel = getChannel(channelName)
  channel.subscribe(eventName, (message) => {
    callback(message.data)
  })
  return () => {
    channel.unsubscribe(eventName)
  }
}

export function buildChannelName(restaurantId: string, type: string): string {
  return `restaurant:${restaurantId}:${type}`
}
