import { Component, OnInit, TemplateRef } from '@angular/core';
import { EventoService } from '../_services/evento.service';
import { Evento } from '../_models/Evento';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { UntypedFormGroup, Validators, UntypedFormBuilder } from '@angular/forms';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { ptBrLocale } from 'ngx-bootstrap/locale';
defineLocale('pt-br', ptBrLocale);
import { ToastrService } from 'ngx-toastr';



@Component({
  selector: 'app-eventos',
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.css']
})
export class EventosComponent implements OnInit {
  
  titulo = 'Eventos';
  eventosFiltrados: Evento[];
  eventos: Evento[];
  
  evento: Evento;
  modoSalvar = 'post';
  
  imagemLargura = 50;
  imagemMargem = 2;
  mostrarImagem = false;
  registerForm: UntypedFormGroup;
  bodyDeletarEvento = '';
  
  file: File;
  fileNameToUpdate: string;
  dataAtual: string;
  
  _filtroLista: string;

  
  constructor(
    private eventoService: EventoService
    , private modalService: BsModalService
    , private fb: UntypedFormBuilder
    , private localeService: BsLocaleService
    , private toastr: ToastrService
    ) { 
      this.localeService.use('pt-br');
    }
    
    get filtroLista(): string {
      return this._filtroLista;
    }
    
    set filtroLista(value: string) {
      this._filtroLista = value;
      this.eventosFiltrados = this._filtroLista ? this.filtrarEventos(this.filtroLista) : this.eventos;
    }
    
    editarEvento(evento: Evento, template: any) {
      this.modoSalvar = 'put';
      this.openModal(template);
      this.evento = Object.assign({}, evento);
      this.fileNameToUpdate = evento.imagemURL.toString();
      this.evento.imagemURL = '';
      this.registerForm.patchValue(this.evento);
    }
    
    novoEvento(template: any) {
      this.modoSalvar = 'post';
      this.openModal(template);
    }
    
    excluirEvento(evento: Evento, template: any) {
      this.openModal(template);
      this.evento = evento;
      this.bodyDeletarEvento = `Tem certeza que deseja excluir o Evento: ${evento.tema}, Código: ${evento.id}`;
    }
    
    confirmeDelete(template: any) {
      this.eventoService.deleteEvento(this.evento.id).subscribe(
        () => {
          template.hide();
          this.getEventos();
          this.toastr.success('Evento excluído com sucesso');
        }, error => {
          this.toastr.error(`Erro ao excluir: ${error}`);
          console.log(error);
        }
        );
      }
      
      openModal(template: any) {
        this.registerForm.reset();
        template.show();
      }
      
      ngOnInit() {
        this.validation();
        this.getEventos();
      }
      
      filtrarEventos(filtrarPor: string): Evento[] {
        filtrarPor = filtrarPor.toLocaleLowerCase();
        return this.eventos.filter(
          evento => evento.tema.toLocaleLowerCase().indexOf(filtrarPor) !== -1
          );
        }
        
        alternarImagem() {
          this.mostrarImagem = !this.mostrarImagem;
        }
        
        validation() {
          this.registerForm = this.fb.group({
            tema: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
            local: ['', Validators.required],
            dataEvento: ['', Validators.required],
            imagemURL: ['', Validators.required],
            qtdPessoas: ['', [Validators.required, Validators.max(120000)]],
            telefone: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]]
          });
        }
        
        uploadImage() {
          if (this.modoSalvar === 'post') {
            const nomeArquivo = this.evento.imagemURL.split('\\', 3);
            
            this.evento.imagemURL = nomeArquivo[2];
            this.eventoService.postUpload(this.file, nomeArquivo[2])
            .subscribe(
              () => {
                this.dataAtual = new Date().getMilliseconds().toString();
                this.getEventos();
              }
            );
          } else {
            const nomeArquivo = this.evento.imagemURL.split('\\', 3);
            
            this.evento.imagemURL = this.fileNameToUpdate;
            this.eventoService.postUpload(this.file, this.fileNameToUpdate)
            .subscribe(
              () => {
                this.dataAtual = new Date().getMilliseconds().toString();
                this.getEventos();
              }
            );
          }
        }
        salvarAlteracao(template: any) {
          if (this.registerForm.valid) {
            if (this.modoSalvar === 'post') {
              this.evento = Object.assign({}, this.registerForm.value);
              
              this.uploadImage();
              
              this.eventoService.postEvento(this.evento).subscribe(
                (novoEvento: Evento) => {
                  console.log(novoEvento);
                  template.hide();
                  this.getEventos();
                  this.toastr.success('Evento salvo com sucesso');
                }, error => {
                  this.toastr.error(`Erro ao salvar: ${error}`);
                  console.log(error);
                }
                );
              } else {
                this.evento = Object.assign({id: this.evento.id}, this.registerForm.value);
                
                this.uploadImage();
                
                this.eventoService.putEvento(this.evento).subscribe(
                  () => {
                    template.hide();
                    this.getEventos();
                    this.toastr.success('Evento editado com sucesso');
                  }, error => {
                    this.toastr.error(`Erro ao editar: ${error}`);
                    console.log(error);
                  }
                  );
                }
              }
            }
            
            onFileChange(event){
              const reader = new FileReader();
              if (event.target.files && event.target.files.length) {
                this.file = event.target.files;
                
              }
            }
            
            getEventos() {
              this.dataAtual = new Date().getMilliseconds().toString();
              this.eventoService.getAllEvento().subscribe(
                (_eventos: Evento[]) => {
                  this.eventos = _eventos;
                  this.eventosFiltrados = this.eventos;
                }, error => {
                  this.toastr.error(`Erro ao carregar eventos: ${error}`);
                  console.log(error);
                });
              }
            }