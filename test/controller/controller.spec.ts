import "mocha"
import { expect } from "chai"
import { Controller, HitEvent, Input } from "../../src/controller/controller"
import { Container } from "../../src/controller/container"
import { Aim } from "../../src/controller/aim"
import { WatchAim } from "../../src/controller/watchaim"
import { PlayShot } from "../../src/controller/playshot"
import { End } from "../../src/controller/end"
import { AbortEvent } from "../../src/events/abortevent"
import { EventUtil } from "../../src/events/eventutil"
import { AimEvent } from "../../src/events/aimevent"
import { BeginEvent } from "../../src/events/beginevent"
import { WatchEvent } from "../../src/events/watchevent"
import { StationaryEvent } from "../../src/events/stationaryevent"
import { GameEvent } from "../../src/events/gameevent"
import { WatchShot } from "../../src/controller/watchshot"
import { Outcome } from "../../src/model/outcome"
import { PlaceBall } from "../../src/controller/placeball"
import { ChatEvent } from "../../src/events/chatevent"

describe("Controller", () => {
  let container: Container
  let broadcastEvents: GameEvent[]

  beforeEach(function (done) {
    container = new Container(undefined, (_) => {})
    broadcastEvents = []
    container.broadcast = (x) =>
      broadcastEvents.push(EventUtil.fromSerialised(x))
    done()
  })

  it("Abort takes Aim to End", (done) => {
    const controller: Controller = new Aim(container)
    const event: GameEvent = new AbortEvent()
    expect(event.applyToController(controller)).to.be.an.instanceof(End)
    done()
  })

  it("Begin takes Init to Aim", (done) => {
    container.eventQueue.push(new BeginEvent())
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(PlaceBall)
    expect(broadcastEvents.pop()).to.be.an.instanceof(WatchEvent)
    done()
  })

  it("WatchEvent takes Init to WatchAim", (done) => {
    container.eventQueue.push(new WatchEvent(container.table.serialise()))
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(WatchAim)
    done()
  })

  it("HitEvent takes WatchAim to PlayShot", (done) => {
    container.controller = new WatchAim(container)
    container.eventQueue.push(new HitEvent(container.table.serialise()))
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(WatchShot)
    done()
  })

  it("AimEvent takes WatchAim to WatchAim", (done) => {
    container.controller = new WatchAim(container)
    container.eventQueue.push(new AimEvent())
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(WatchAim)
    done()
  })

  it("AimEvent takes WatchShot to Aim when all stationary", (done) => {
    const watchShot = new WatchShot(container)
    watchShot.allStationary = true
    container.controller = watchShot
    container.table.balls[0].setStationary()
    container.eventQueue.push(new AimEvent())
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(Aim)
    done()
  })

  it("WatchEvent takes WatchShot to WatchAim when all stationary", (done) => {
    const watchShot = new WatchShot(container)
    watchShot.allStationary = true
    container.controller = watchShot
    container.table.balls[0].setStationary()
    container.eventQueue.push(new WatchEvent(container.table.serialise()))
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(WatchAim)
    done()
  })

  it("AimEvent does not take WatchShot to Aim when not stationary", (done) => {
    container.controller = new WatchShot(container)
    container.eventQueue.push(new AimEvent())
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(WatchShot)
    done()
  })

  it("AimEvent takes WatchShot to enqueued Aim after all stationary", (done) => {
    const watchShot = new WatchShot(container)
    watchShot.allStationary = false
    container.controller = watchShot
    container.table.balls[0].setStationary()
    container.eventQueue.push(new AimEvent())
    container.processEvents()
    container.eventQueue.push(new StationaryEvent())
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(Aim)
    done()
  })

  it("WatchEvent takes WatchShot to enqueued WatchAim after all stationary", (done) => {
    const watchShot = new WatchShot(container)
    watchShot.allStationary = false
    container.controller = watchShot
    container.table.balls[0].setStationary()
    container.eventQueue.push(new WatchEvent(container.table.serialise()))
    container.processEvents()
    container.eventQueue.push(new StationaryEvent())
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(WatchAim)
    done()
  })

  it("StationaryEvent takes WatchShot to WatchShot", (done) => {
    container.controller = new WatchShot(container)
    container.eventQueue.push(new StationaryEvent())
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(WatchShot)
    done()
  })

  it("StationaryEvent takes active PlayShot to WatchAim if no pot", (done) => {
    container.controller = new PlayShot(container)
    container.table.balls[0].setStationary()
    container.eventQueue.push(new StationaryEvent())
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(WatchAim)
    done()
  })

  it("StationaryEvent takes active PlayShot to Aim if pot", (done) => {
    container.controller = new PlayShot(container)
    container.table.balls[0].setStationary()
    container.eventQueue.push(new StationaryEvent())
    container.table.outcome.push(Outcome.pot(container.table.balls[1], 1))
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(Aim)
    done()
  })

  it("End handles all events", (done) => {
    container.controller = new End(container)
    container.eventQueue.push(new AbortEvent())
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(End)
    container.eventQueue.push(new AimEvent())
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(End)
    container.eventQueue.push(new BeginEvent())
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(End)
    container.eventQueue.push(new HitEvent(container.table.serialise()))
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(End)
    container.eventQueue.push(new WatchEvent(container.table))
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(End)
    container.eventQueue.push(new StationaryEvent())
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(End)
    container.eventQueue.push(new ChatEvent("", ""))
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(End)
    container.inputQueue.push(new Input(0.1, "ArrowLeft"))
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(End)
    done()
  })

  it("Aim handles all inputs", (done) => {
    container.controller = new Aim(container)
    container.inputQueue.push(new Input(0.1, "A"))
    container.inputQueue.push(new Input(0.1, "ArrowLeft"))
    container.inputQueue.push(new Input(0.1, "ArrowRight"))
    container.inputQueue.push(new Input(0.1, "ShiftArrowLeft"))
    container.inputQueue.push(new Input(0.1, "ShiftArrowRight"))
    container.inputQueue.push(new Input(0.1, "ArrowUp"))
    container.inputQueue.push(new Input(0.1, "ArrowDown"))
    container.inputQueue.push(new Input(0.1, "Space"))
    container.inputQueue.push(new Input(0.1, "SpaceUp"))
    container.inputQueue.push(new Input(0.1, "KeyPUp"))
    container.inputQueue.push(new Input(0.1, "KeyHUp"))
    container.inputQueue.push(new Input(0.1, "KeyOUp"))
    container.inputQueue.push(new Input(0.1, "NumpadAdd"))
    container.inputQueue.push(new Input(0.1, "NumpadSubtract"))
    container.inputQueue.push(new Input(0.1, "movementXUp"))
    container.inputQueue.push(new Input(0.1, "movementYUp"))

    let count = container.inputQueue.length
    while (count-- > 0) {
      container.processEvents()
    }
    expect(container.inputQueue.length).to.equal(0)
    done()
  })

  it("advance generates no event", (done) => {
    container.advance(0.1)
    expect(container.eventQueue.length).to.equal(0)
    done()
  })

  it("advance generates StationaryEvent at end of shot", (done) => {
    container.controller = new PlayShot(container)
    container.table.balls[0].vel.x = 0.001
    container.advance(0.01)
    expect(container.eventQueue.length).to.equal(1)
    container.table.outcome.push(Outcome.pot(container.table.balls[1], 1))
    container.processEvents()
    container.advance(0.01)
    expect(container.eventQueue.length).to.equal(0)
    done()
  })

  it("ChatEvent handled with no change of state", (done) => {
    const watchShot = new WatchShot(container)
    watchShot.allStationary = false
    container.controller = watchShot
    container.table.balls[0].setStationary()
    container.eventQueue.push(new ChatEvent("", ""))
    container.processEvents()
    expect(container.controller).to.be.an.instanceof(WatchShot)
    done()
  })
})
