import { VirtualDevice } from './VirtualDevice.js';
import logger from '../config/logger.js';

export class MeshSimulatorService {
  static instance;
  devices = new Map();

  constructor() {
    this.seedDefaultDevices();
  }

  static getInstance() {
    if (!MeshSimulatorService.instance) {
      MeshSimulatorService.instance = new MeshSimulatorService();
    }
    return MeshSimulatorService.instance;
  }

  seedDefaultDevices() {
    this.devices.set('phone-alice', new VirtualDevice('phone-alice', false));
    this.devices.set('phone-stranger1', new VirtualDevice('phone-stranger1', false));
    this.devices.set('phone-stranger2', new VirtualDevice('phone-stranger2', false));
    this.devices.set('phone-stranger3', new VirtualDevice('phone-stranger3', false));
    this.devices.set('phone-bridge', new VirtualDevice('phone-bridge', true));
  }

  getDevices() {
    return Array.from(this.devices.values());
  }

  getDevice(id) {
    return this.devices.get(id);
  }

  inject(senderDeviceId, packet) {
    const sender = this.devices.get(senderDeviceId);
    if (!sender) {
      throw new Error(`Unknown device: ${senderDeviceId}`);
    }
    sender.hold(packet);
    logger.info(`Packet ${packet.packetId.substring(0, 8)} injected at ${senderDeviceId} (TTL=${packet.ttl})`);
  }

  gossipOnce() {
    let transfers = 0;
    const deviceList = Array.from(this.devices.values());

    const snapshot = new Map();
    for (const d of deviceList) {
      snapshot.set(d.getDeviceId(), d.getHeldPackets());
    }

    for (const src of deviceList) {
      const srcPackets = snapshot.get(src.getDeviceId()) || [];
      for (const pkt of srcPackets) {
        if (pkt.ttl <= 0) continue;

        for (const dst of deviceList) {
          if (dst.getDeviceId() === src.getDeviceId()) continue;
          if (dst.holds(pkt.packetId)) continue;

          const copy = {
            packetId: pkt.packetId,
            ttl: pkt.ttl - 1,
            createdAt: pkt.createdAt,
            ciphertext: pkt.ciphertext,
          };
          dst.hold(copy);
          transfers++;
        }
      }
    }

    logger.info(`Gossip round complete: ${transfers} packet transfers`);
    return {
      transfers,
      deviceCounts: this.snapshotMap(),
    };
  }

  snapshotMap() {
    const counts = {};
    for (const d of this.devices.values()) {
      counts[d.getDeviceId()] = d.packetCount();
    }
    return counts;
  }

  collectBridgeUploads() {
    const uploads = [];
    for (const d of this.devices.values()) {
      if (!d.hasInternet()) continue;
      for (const pkt of d.getHeldPackets()) {
        uploads.push({
          bridgeNodeId: d.getDeviceId(),
          packet: pkt,
        });
      }
    }
    return uploads;
  }

  resetMesh() {
    for (const d of this.devices.values()) {
      d.clear();
    }
    logger.info('Simulator mesh devices cleared');
  }
}
export default MeshSimulatorService;
