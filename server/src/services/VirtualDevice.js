export class VirtualDevice {
  deviceId;
  hasInternetConnection;
  heldPackets = new Map();

  constructor(deviceId, hasInternet) {
    this.deviceId = deviceId;
    this.hasInternetConnection = hasInternet;
  }

  getDeviceId() {
    return this.deviceId;
  }

  hasInternet() {
    return this.hasInternetConnection;
  }

  hold(packet) {
    if (!this.heldPackets.has(packet.packetId)) {
      this.heldPackets.set(packet.packetId, packet);
    }
  }

  getHeldPackets() {
    return Array.from(this.heldPackets.values());
  }

  holds(packetId) {
    return this.heldPackets.has(packetId);
  }

  packetCount() {
    return this.heldPackets.size;
  }

  clear() {
    this.heldPackets.clear();
  }
}
export default VirtualDevice;
