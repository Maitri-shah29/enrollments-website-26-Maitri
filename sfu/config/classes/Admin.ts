import { Client } from "./Client.js";

export class Admin extends Client {
  /**
   * Kick a client from the room
   */
  kickClient(targetClientId: string): boolean {
    // Logic to kick will be handled by the server using this method call as a signal
    // or we can implement direct transport closing here if we have access to the room
    // For now, this met  hod signifies the intent and capability.
    return true;
  }

  /**
   * Close a remote producer (stop someone's screen share or video)
   */
  closeRemoteProducer(producerId: string): boolean {
    return true;
  }
}
