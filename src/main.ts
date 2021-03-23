import { Container } from "./controller/container"
import { BeginEvent } from "./events/beginevent"
import { Keyboard } from "./events/keyboard"
/*
import {
  Color,
  PerspectiveCamera,
  DirectionalLight,
  Scene,
  CanvasTexture,
  MeshBasicMaterial,
  PlaneGeometry,
  Mesh,
  IcosahedronGeometry,
  BufferAttribute,
  MeshPhongMaterial,
  WebGLRenderer,
} from "three"
*/

var controller1 = new Container(document.getElementById("viewP1"), (_) => {})

controller1.broadcast = (_) => {}
controller1.eventQueue.push(new BeginEvent())

var keyboard = new Keyboard()

var lastTime = performance.now()

function sampleInputs() {
  var t = performance.now() - lastTime
  lastTime = performance.now()
  var inputs = keyboard.getEvents(t)
  inputs.forEach((i) => controller1.inputQueue.push(i))
  requestAnimationFrame((_) => {
    sampleInputs()
  })
}

// trigger input polling
sampleInputs()

// trigger animation loops
controller1.animate(performance.now())

/*
let scene, renderer

let mouseX = 0

let windowWidth, windowHeight

const views = [
  {
    left: 0,
    bottom: 0,
    width: 1,
    height: 1.0,
    background: new Color(0.5, 0.5, 0.7),
    eye: [0, 300, 1800],
    up: [0, 1, 0],
    fov: 30,
    camera: PerspectiveCamera,
    updateCamera: function (camera, scene, mouseX) {
      camera.position.x += mouseX * 0.015
      camera.position.x = Math.max(Math.min(camera.position.x, 1000), -1000)
      camera.lookAt(scene.position)
    },
  },
  {
    left: 0.7,
    bottom: 0,
    width: 0.3,
    height: 0.3,
    background: new Color(0.7, 0.5, 0.5),
    eye: [0, 1800, 0],
    up: [0, 0, 1],
    fov: 45,
    camera: PerspectiveCamera,
    updateCamera: function (camera, _, mouseX) {
      camera.position.x -= mouseX * 0.015
      camera.position.x = Math.max(Math.min(camera.position.x, 1000), -1000)
      camera.lookAt(camera.position.clone().setY(0))
    },
  },
]

init()
animate()

function init() {
  const container = document.getElementById("container")

  for (let ii = 0; ii < views.length; ++ii) {
    const view = views[ii]
    const camera = new PerspectiveCamera(
      view.fov,
      window.innerWidth / window.innerHeight,
      1,
      10000
    )
    camera.position.fromArray(view.eye)
    camera.up.fromArray(view.up)
    view.camera = camera
  }

  scene = new Scene()

  const light = new DirectionalLight(0xffffff)
  light.position.set(0, 0, 1)
  scene.add(light)

  // shadow

  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 128

  const context = canvas.getContext("2d")
  const gradient = context!.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2
  )
  gradient.addColorStop(0.1, "rgba(0,0,0,0.15)")
  gradient.addColorStop(1, "rgba(0,0,0,0)")

  context!.fillStyle = gradient
  context!.fillRect(0, 0, canvas.width, canvas.height)

  const shadowTexture = new CanvasTexture(canvas)

  const shadowMaterial = new MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
  })
  const shadowGeo = new PlaneGeometry(300, 300, 1, 1)

  let shadowMesh

  shadowMesh = new Mesh(shadowGeo, shadowMaterial)
  shadowMesh.position.y = -250
  shadowMesh.rotation.x = -Math.PI / 2
  scene.add(shadowMesh)

  shadowMesh = new Mesh(shadowGeo, shadowMaterial)
  shadowMesh.position.x = -400
  shadowMesh.position.y = -250
  shadowMesh.rotation.x = -Math.PI / 2
  scene.add(shadowMesh)

  shadowMesh = new Mesh(shadowGeo, shadowMaterial)
  shadowMesh.position.x = 400
  shadowMesh.position.y = -250
  shadowMesh.rotation.x = -Math.PI / 2
  scene.add(shadowMesh)

  const radius = 200

  const geometry1 = new IcosahedronGeometry(radius, 1)

  const count = geometry1.attributes.position.count
  geometry1.setAttribute(
    "color",
    new BufferAttribute(new Float32Array(count * 3), 3)
  )

  const geometry2 = geometry1.clone()
  const geometry3 = geometry1.clone()

  const color = new Color()
  const positions1 = geometry1.attributes.position
  const positions2 = geometry2.attributes.position
  const positions3 = geometry3.attributes.position
  const colors1 = geometry1.attributes.color
  const colors2 = geometry2.attributes.color
  const colors3 = geometry3.attributes.color

  for (let i = 0; i < count; i++) {
    color.setHSL((positions1.getY(i) / radius + 1) / 2, 1.0, 0.5)
    colors1.setXYZ(i, color.r, color.g, color.b)

    color.setHSL(0, (positions2.getY(i) / radius + 1) / 2, 0.5)
    colors2.setXYZ(i, color.r, color.g, color.b)

    color.setRGB(1, 0.8 - (positions3.getY(i) / radius + 1) / 2, 0)
    colors3.setXYZ(i, color.r, color.g, color.b)
  }

  const material = new MeshPhongMaterial({
    color: 0xffffff,
    flatShading: true,
    vertexColors: true,
    shininess: 0,
  })

  const wireframeMaterial = new MeshBasicMaterial({
    color: 0x000000,
    wireframe: true,
    transparent: true,
  })

  let mesh = new Mesh(geometry1, material)
  let wireframe = new Mesh(geometry1, wireframeMaterial)
  mesh.add(wireframe)
  mesh.position.x = -400
  mesh.rotation.x = -1.87
  scene.add(mesh)

  mesh = new Mesh(geometry2, material)
  wireframe = new Mesh(geometry2, wireframeMaterial)
  mesh.add(wireframe)
  mesh.position.x = 400
  scene.add(mesh)

  mesh = new Mesh(geometry3, material)
  wireframe = new Mesh(geometry3, wireframeMaterial)
  mesh.add(wireframe)
  scene.add(mesh)

  renderer = new WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  container!.appendChild(renderer.domElement)

  document.addEventListener("mousemove", onDocumentMouseMove)
}

function onDocumentMouseMove(event) {
  mouseX = event.clientX - windowWidth / 2
}

function updateSize() {
  if (windowWidth != window.innerWidth || windowHeight != window.innerHeight) {
    windowWidth = window.innerWidth
    windowHeight = window.innerHeight

    renderer.setSize(windowWidth, windowHeight)
  }
}

function animate() {
  render()

  requestAnimationFrame(animate)
}

function render() {
  updateSize()

  for (let ii = 0; ii < views.length; ++ii) {
    const view = views[ii]
    const camera = view.camera

    view.updateCamera(camera, scene, mouseX)

    const left = Math.floor(windowWidth * view.left)
    const bottom = Math.floor(windowHeight * view.bottom)
    const width = Math.floor(windowWidth * view.width)
    const height = Math.floor(windowHeight * view.height)

    renderer.setViewport(left, bottom, width, height)
    renderer.setScissor(left, bottom, width, height)
    renderer.setScissorTest(true)
    renderer.setClearColor(view.background)

    camera!.aspect = width / height
    camera!.updateProjectionMatrix()

    renderer.render(scene, camera)
  }
}
*/