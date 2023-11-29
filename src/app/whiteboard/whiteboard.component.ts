import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  OnInit,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import * as TwilioSync from 'twilio-sync';
import axios from 'axios';

@Component({
  selector: 'app-whiteboard',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './whiteboard.component.html',
  styleUrl: './whiteboard.component.scss',
})
export class WhiteboardComponent implements OnInit, AfterViewInit {
  @ViewChild('whiteboardCanvas') canvasRef!: ElementRef;
  private context!: CanvasRenderingContext2D;
  private current: { x: number; y: number; color: string } = {
    x: 0,
    y: 0,
    color: 'black',
  };
  private drawing: boolean = false;
  message: string = '';
  syncClient: TwilioSync.Client | undefined;
  syncStream: any;

  ngOnInit(): void {
    this.getTokenAndInitializeSync();
  }

  getTokenAndInitializeSync(): void {
    axios
      .get('http://localhost:8050/whiteboard')
      .then((response: any) => {
        const token = response.data.token;
        this.initializeSync(token);
      })
      .catch((error: any) => {
        console.error('Error fetching token:', error);
      });
  }

  initializeSync(token: string): void {
    const syncClient = new TwilioSync.Client(token, {
      logLevel: 'info',
    });

    syncClient.on('connectionStateChanged', (state: string) => {
      if (state !== 'connected') {
        this.message = `Sync is not live (websocket connection <span style="color: red">${state}</span>)...`;
      } else {
        this.message = 'Sync is live!';
      }
    });
  }

  createSyncStream(syncClient: TwilioSync.Client): void {
    syncClient.stream('drawingData').then((stream) => {
      stream.on('messagePublished', (event: any) => {
        this.syncDrawingData(event.message.value);
      });
    });
  }

  syncDrawingData(data: any): void {
    const canvas = this.canvasRef.nativeElement;
    const context = canvas.getContext('2d');

    const w = canvas.width;
    const h = canvas.height;
    this.drawLine(
      data.x0 * w,
      data.y0 * h,
      data.x1 * w,
      data.y1 * h,
      data.color
    );
  }

  ngAfterViewInit(): void {
    const canvas: HTMLCanvasElement = this.canvasRef.nativeElement;
    this.context = canvas.getContext('2d')!;
    this.setupEventListeners();
  }

  private drawLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string
  ) {
    const canvas = this.canvasRef.nativeElement;
    const context = canvas.getContext('2d');

    // Draw line on the canvas
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.stroke();
    context.closePath();

    // Publish drawing data to the Sync Stream if it exists
    if (this.syncStream) {
      const w = canvas.width;
      const h = canvas.height;

      this.syncStream.publishMessage({
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color: color,
      });
    }
  }

  onMouseUp(e: MouseEvent): void {
    if (!this.drawing) {
      return;
    }
    this.drawing = false;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.drawLine(
      this.current.x,
      this.current.y,
      e.clientX - rect.left,
      e.clientY - rect.top,
      this.current.color
    );
  }

  private onMouseDown(e: MouseEvent): void {
    this.drawing = true;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.current.x = e.clientX - rect.left;
    this.current.y = e.clientY - rect.top;
  }

  onMouseMove(e: MouseEvent): void {
    if (!this.drawing) {
      return;
    }
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.drawLine(
      this.current.x,
      this.current.y,
      e.clientX - rect.left,
      e.clientY - rect.top,
      this.current.color
    );
    this.current.x = e.clientX - rect.left;
    this.current.y = e.clientY - rect.top;
  }

  private setupEventListeners() {
    const canvas: HTMLCanvasElement = this.canvasRef.nativeElement;
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseout', this.onMouseUp.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
  }
}
