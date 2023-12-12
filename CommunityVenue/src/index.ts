import { Building } from './building'
import * as dclu from '@dclu/dclu-liveteach'
import * as ecs from "@dcl/sdk/ecs"
import { setupUi } from './ui'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { Podium } from './podium/podium'
import { ClassroomManager, ControllerUI } from '@dclu/dclu-liveteach/src/classroom'
import { PeerToPeerChannel } from "@dclu/dclu-liveteach/src/classroom/comms/peerToPeerChannel";
import * as classroom1Config from "./classroomConfigs/classroom1Config.json"
import * as classroom2Config from "./classroomConfigs/classroom2Config.json"
import * as classroom3Config from "./classroomConfigs/classroom3Config.json"
import * as classroom4Config from "./classroomConfigs/classroom4Config.json"
import { DoorManager } from './doors/doorManager'
import { SeatingData } from './SeatingData'
import { LiftManager } from './lifts/liftManager'
import { AudioManager } from './audio/audioManager'
import { GetCurrentRealmResponse, getCurrentRealm } from "~system/EnvironmentApi"

let devLiveTeachContractAddress: string = "0xf44b11C7c7248c592d0Cc1fACFd8a41e48C52762"
let devTeachersContractAddress: string = "0x15eD220A421FD58A66188103A3a3411dA9d22295"

export function main() {
    ecs.executeTask(async () => {
        const communicationChannel = new PeerToPeerChannel()

        // Initialise the ClassroomManager asynchronously as it depends on getCurrentRealm
        let getCurrentRealmResponse: GetCurrentRealmResponse = await getCurrentRealm({})
        let useDev = false;
        // detect tigertest realm
        if (getCurrentRealmResponse &&
            getCurrentRealmResponse.currentRealm &&
            getCurrentRealmResponse.currentRealm.serverName) {
            if (getCurrentRealmResponse.currentRealm.serverName.toLocaleLowerCase().indexOf("tigertest") != -1) {
                useDev = true;
            }
        }
        if (useDev) {
            ClassroomManager.Initialise(communicationChannel, devLiveTeachContractAddress, devTeachersContractAddress, false)
        }
        else {
            // default to mainnet
            ClassroomManager.Initialise(communicationChannel, undefined, undefined, false)
        }

        // Add contract guid here for testing
        ClassroomManager.SetTestContractGuid("9222a104-9eae-41b4-87b1-ec4b9116e47b")

        // Add wallet address here for testing
        ClassroomManager.AddTestTeacherAddress("0xbea7ad6cdb932fd81eb386cc9bd21e426b99cb37")

        //////////// Class 1 - Lecture Theatre 1 (left) ////////////
        ClassroomManager.RegisterClassroom(classroom1Config)
        const podium1 = new Podium(Vector3.create(16, 6.9, 30.3), Vector3.create(0, -90, 0))
        addScreen(classroom1Config.classroom.guid, Vector3.create(0.35, 1.7, -0.06), Quaternion.fromEulerDegrees(45, 90, 0), Vector3.create(0.2, 0.2, 0.2), podium1.entity)
        addScreen(classroom1Config.classroom.guid, Vector3.create(11.9, 7, 45.58), Quaternion.fromEulerDegrees(0, 0, 0), Vector3.create(8.15, 8.15, 8.15), null)

        //////////// Class 2 - Lecture Theatre 2 (right) ////////////
        ClassroomManager.RegisterClassroom(classroom2Config)
        const podium2 = new Podium(Vector3.create(33, 6.9, 30.3), Vector3.create(0, -90, 0))
        addScreen(classroom2Config.classroom.guid, Vector3.create(0.35, 1.7, -0.06), Quaternion.fromEulerDegrees(45, 90, 0), Vector3.create(0.2, 0.2, 0.2), podium2.entity)
        addScreen(classroom2Config.classroom.guid, Vector3.create(36.9, 7, 45.58), Quaternion.fromEulerDegrees(0, 0, 0), Vector3.create(8.15, 8.15, 8.15), null)

        //////////// Class 3 - Classroom 1 (bottom) ////////////
        ClassroomManager.RegisterClassroom(classroom3Config)
        const podium3 = new Podium(Vector3.create(32, 6.9, 16.8), Vector3.create(0, 90, 0))
        addScreen(classroom3Config.classroom.guid, Vector3.create(0.35, 1.7, -0.06), Quaternion.fromEulerDegrees(45, 90, 0), Vector3.create(0.2, 0.2, 0.2), podium3.entity)
        addScreen(classroom3Config.classroom.guid, Vector3.create(39.15, 9.73, 20.5), Quaternion.fromEulerDegrees(0, 0, 0), Vector3.create(4.1, 4.1, 4.1), null)

        //////////// Class 4 - Classroom 2 (top) ////////////
        ClassroomManager.RegisterClassroom(classroom4Config)
        const podium4 = new Podium(Vector3.create(32, 6.9 + 6.1, 16.8), Vector3.create(0, 90, 0))
        addScreen(classroom4Config.classroom.guid, Vector3.create(0.35, 1.7, -0.06), Quaternion.fromEulerDegrees(45, 90, 0), Vector3.create(0.2, 0.2, 0.2), podium4.entity)
        addScreen(classroom4Config.classroom.guid, Vector3.create(39.15, 9.73 + 6.1, 20.5), Quaternion.fromEulerDegrees(0, 0, 0), Vector3.create(4.1, 4.1, 4.1), null)
    })

    dclu.setup({
        ecs: ecs,
        Logger: null
    })
    setupUi()

    new AudioManager()
    new Building()
    new LiftManager()
    new DoorManager()

    // Add seating 
    let seatingData: SeatingData = new SeatingData()

    // Apply offset
    let offset = Vector3.create(0, 0.2, 0)
    seatingData.seats.forEach((seat, index) => {
        // update ids after combining
        seat.id = index
        seat.position = Vector3.add(seat.position, offset)
        seat.lookAtTarget = Vector3.create(seat.position.x, seat.position.y, seat.position.z + 5)
    });

    //ControllerUI.Show()

    //Debugging  
    // seatingData.seats.forEach(seat => {
    //   let entity: ecs.Entity = ecs.engine.addEntity()
    //   ecs.Transform.create(entity, {position:seat.position, rotation: Quaternion.fromEulerDegrees(seat.rotation.x,seat.rotation.y,seat.rotation.z)})
    //   ecs.MeshRenderer.setBox(entity)
    // });

    new dclu.seating.SeatingController(seatingData, Vector3.create(12, -50, 19), Vector3.create(10, 7, 12), true)
}

export function addScreen(_guid: string, _position: Vector3, _rotation: Quaternion, _scale: Vector3, _parent: ecs.Entity): void {
    ClassroomManager.AddScreen(_guid, _position, _rotation, _scale, _parent)
}