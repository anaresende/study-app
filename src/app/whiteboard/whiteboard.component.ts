import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

declare var Twilio: any;

@Component({
  selector: 'app-whiteboard',
  standalone: true,
  imports: [CommonModule],
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
  syncClient: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeSyncClient();
  }

  initializeSyncClient(): void {
    this.http.get('http://localhost:8050/whiteboard').subscribe(
      (tokenResponse: any) => {
        this.syncClient = new Twilio.Sync.Client(tokenResponse.token, {
          logLevel: 'info',
        });
        this.syncClient.on('connectionStateChanged', (state: string) => {
          if (state !== 'connected') {
            this.message = `Sync is not live (websocket connection <span style="color: red">${state}</span>)...`;
          } else {
            this.message = 'Sync is live!';
          }
        });
      },
      (error: any) => {
        console.error('Error fetching token:', error);
      }
    );
  }

  ngAfterViewInit(): void {
    const canvas: HTMLCanvasElement = this.canvasRef.nativeElement;
    this.context = canvas.getContext('2d')!;
    this.setupEventListeners();
    this.onResize();
  }

  private drawLine(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string
  ) {
    this.context.beginPath();
    this.context.moveTo(x0, y0);
    this.context.lineTo(x1, y1);
    this.context.strokeStyle = color;
    this.context.lineWidth = 2;
    this.context.stroke();
    this.context.closePath();
  }

  private onMouseDown(e: MouseEvent) {
    this.drawing = true;
    this.current.x = e.clientX;
    this.current.y = e.clientY;
  }

  private onMouseUp(e: MouseEvent) {
    if (!this.drawing) {
      return;
    }
    this.drawing = false;
    this.drawLine(
      this.current.x,
      this.current.y,
      e.clientX,
      e.clientY,
      this.current.color
    );
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.drawing) {
      return;
    }
    this.drawLine(
      this.current.x,
      this.current.y,
      e.clientX,
      e.clientY,
      this.current.color
    );
    this.current.x = e.clientX;
    this.current.y = e.clientY;
  }

  private onResize() {
    const canvas: HTMLCanvasElement = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  private setupEventListeners() {
    const canvas: HTMLCanvasElement = this.canvasRef.nativeElement;
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseout', this.onMouseUp.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));

    window.addEventListener('resize', this.onResize.bind(this));
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event) {
    this.onResize();
  }
}
