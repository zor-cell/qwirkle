import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrl: './camera.component.css'
})
export class CameraComponent implements OnInit {
  uploadFileUrl: string = "";

  constructor() {}

  ngOnInit() {
  }

  uploadFile(event: any) {
    let files: FileList = event.target.files;

    if(files.length != 1) return;

    this.uploadFileUrl = URL.createObjectURL(files.item(0)!);
  }

  onImageLoad() {
    let mat = cv.imread('inputImage');
    cv.imshow('outputImage', mat);
    mat.delete();
  }

  //TODO add to angular.json scripts for opencv usage
  //              "src/assets/opencv/opencv_init.js",
  //               "src/assets/opencv/opencv.js"
}
