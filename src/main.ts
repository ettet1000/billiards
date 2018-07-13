import { Ball } from "./ball"
import { Table } from "./table"
import { Rack } from "./rack"
import { Camera } from "./camera"
import { TableGeometry } from "./tablegeometry"

import * as THREE from "three"

export class Main {
  scene = new THREE.Scene()
  camera: Camera
  renderer = new THREE.WebGLRenderer()
  material = new THREE.MeshBasicMaterial({
    color: 0xaaaaaa,
    wireframe: false
  })

  table: Table
  t = 0
  animate(): void {
    if (this.t++ > 500) {
      console.log(JSON.stringify(this.table.serialise()))
      this.t = 0
    }
    try {
      this.table.advance(0.02)
      this.table.advance(0.02)
      this.table.advance(0.02)
      this.camera.update(0.06)
      requestAnimationFrame(() => {
        this.animate()
      })
    } catch (error) {
      console.log(error)
    }
    this.render()
  }

  render(): void {
    this.renderer.render(this.scene, this.camera.camera)
  }

  run() {
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    document.body.appendChild(this.renderer.domElement)
    let s = 1.3
    let light = new THREE.DirectionalLight(0xffffff, 1.0)
    light.position.set(0.1, -0.01, 10)
    light.shadow.camera.near = 4
    light.shadow.camera.far = 12
    light.shadow.camera.right = TableGeometry.X * s
    light.shadow.camera.left = -TableGeometry.X * s
    light.shadow.camera.top = TableGeometry.Y * s
    light.shadow.camera.bottom = -TableGeometry.Y * s
    light.shadow.mapSize.width = 1024
    light.shadow.mapSize.height = 1024
    light.castShadow = true

    this.scene.add(light)
    //this.scene.add( new THREE.CameraHelper( light.shadow.camera ) );

    let light2 = new THREE.AmbientLight(0x404040, 1.0)
    this.scene.add(light2)

    let balls = Rack.diamond()
    let b = new Ball(new THREE.Vector3(-10, 0.1, 0))
    b.vel.x = 0
    balls.unshift(b)
    this.table = new Table(balls)
    this.table.balls.forEach(b => this.scene.add(b.mesh))
    this.addTable()
    this.camera = new Camera(this.table)

    this.keyboardSetup()
  }

  addTable() {
    TableGeometry.addToScene(this.scene)
  }

  rate = 0
  rateInc = 0.001

  keyboardSetup() {
    document.addEventListener("keydown", event => {
      if (event.keyCode == 37) {
        this.rate += this.rateInc
        this.table.rotateAim(this.rate)
        event.preventDefault()
      } else if (event.keyCode == 39) {
        this.rate += this.rateInc
        this.table.rotateAim(-this.rate)
        event.preventDefault()
      } else if (event.keyCode == 32) {
        this.table.hit(3)
        event.preventDefault()
      } else if (event.keyCode == 84) {
        this.camera.mode = this.camera.topView
        event.preventDefault()
      } else if (event.keyCode == 65) {
        this.camera.mode = this.camera.aimView
        event.preventDefault()
      }
    })
    document.addEventListener("keyup", ({}) => {
      this.rate = 0
    })
  }
}
