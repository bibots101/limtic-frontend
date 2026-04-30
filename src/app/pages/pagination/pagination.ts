import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination" *ngIf="totalPages > 1">
      <button (click)="change(0)"         [disabled]="page === 0">«</button>
      <button (click)="change(page - 1)"  [disabled]="page === 0">‹</button>

      <button *ngFor="let p of pages()"
              [class.active]="p === page"
              (click)="change(p)">
        {{ p + 1 }}
      </button>

      <button (click)="change(page + 1)"          [disabled]="page === totalPages - 1">›</button>
      <button (click)="change(totalPages - 1)"    [disabled]="page === totalPages - 1">»</button>

      <span class="page-info">Page {{ page + 1 }} / {{ totalPages }}</span>
    </div>
  `,
  styles: [`
    .pagination {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      justify-content: center;
      margin-top: 1.5rem;
      flex-wrap: wrap;
    }
    button {
      background: #1f2937;
      border: 1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.6);
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    button:hover:not(:disabled) {
      background: rgba(0,210,255,0.1);
      color: #00d2ff;
      border-color: rgba(0,210,255,0.3);
    }
    button.active {
      background: rgba(0,210,255,0.15);
      color: #00d2ff;
      border-color: rgba(0,210,255,0.4);
      font-weight: 700;
    }
    button:disabled { opacity: 0.3; cursor: not-allowed; }
    .page-info {
      color: rgba(255,255,255,0.3);
      font-size: 0.8rem;
      margin-left: 0.5rem;
    }
  `]
})
export class PaginationComponent {
  @Input()  page       = 0;
  @Input()  totalPages = 0;
  @Output() pageChange = new EventEmitter<number>();

  change(p: number) {
    if (p >= 0 && p < this.totalPages) this.pageChange.emit(p);
  }

  pages(): number[] {
    const start = Math.max(0, this.page - 2);
    const end   = Math.min(this.totalPages, start + 5);
    return Array.from({ length: end - start }, (_, i) => start + i);
  }
}
