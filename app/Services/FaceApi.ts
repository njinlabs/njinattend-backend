import '@tensorflow/tfjs-node'
import * as faceapi from '@vladmandic/face-api'
import { Canvas, Image, ImageData, loadImage } from 'canvas'
import Application from '@ioc:Adonis/Core/Application'

export type FaceApiDescriptor = {
  descriptor: Float32Array
  toString: () => string
}

class FaceApi {
  private booted: boolean = false

  public async boot() {
    if (this.booted) {
      return
    }

    this.booted = true
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

    await faceapi.nets.faceRecognitionNet.loadFromDisk(
      Application.makePath('app', 'Services', 'FaceModels')
    )
    await faceapi.nets.faceLandmark68Net.loadFromDisk(
      Application.makePath('app', 'Services', 'FaceModels')
    )
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(
      Application.makePath('app', 'Services', 'FaceModels')
    )
  }

  public async tranformToDescriptor(path: string): Promise<null | FaceApiDescriptor> {
    const image = await loadImage(path)
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()

    if (!detections.length) {
      return null
    }

    const descriptor = detections[0]?.descriptor

    return {
      descriptor,
      toString: () => JSON.stringify(descriptor),
    }
  }

  public loadFromString(descriptorString: string): FaceApiDescriptor {
    return {
      descriptor: Float32Array.from(Object.values(JSON.parse(descriptorString))),
      toString: () => descriptorString,
    }
  }

  public matcher(referenceDescriptor: Float32Array, queryDescriptor: Float32Array): boolean {
    const faceMatcher = new faceapi.FaceMatcher([referenceDescriptor])
    const match = faceMatcher.findBestMatch(queryDescriptor)

    return match.distance < 0.4
  }
}

export default new FaceApi()
