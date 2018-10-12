import { Component, OnInit } from '@angular/core';
import { Item } from '../../config/main-config';
import { BackendService } from '../../services/backend.service';
import { ResultfilterService } from '../../services/resultfilter.service';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ViewControlService } from '../../services/view-control.service';

@Component({
  selector: 'resultlist',
  templateUrl: './resultlist.component.html',
  styleUrls: ['./resultlist.component.scss']
})

export class ResultlistComponent {

  //audio vs. video
  appMode = environment.appMode;

  //Modus hsp vs. kindermusik
  mode$: BehaviorSubject<string>;

  //Itemliste als Observable. Wird in Template per async pipe ausgegeben
  items$: Observable<Item[]>;

  //Flag ob Tracks angezeigt werden sollen
  showTracks$: Observable<boolean>;

  //Ist Random erlaubt?
  allowRandom$: BehaviorSubject<boolean>;

  //welches Item in der Liste wurde angeklickt?
  activeItem: string = "";

  //Aktuelle Playlist (kommt von Server)
  files: any[] = [];

  //Services injecten
  constructor(private bs: BackendService, private fs: ResultfilterService, private vcs: ViewControlService) { }

  //beim Init
  ngOnInit() {

    //gefilterte und sortierte Itemliste per Service abbonieren
    this.items$ = this.bs.getFilteredItemlist();

    //flag ob Tracks angezeigt werden abbonieren
    this.showTracks$ = this.fs.getShowTracks();

    //Modus abbonieren
    this.mode$ = this.bs.getMode();

    //AllowRandom abbonieren
    this.allowRandom$ = this.bs.getAllowRandom();

    //ActiveItem abbonieren
    this.bs.getActiveItem().subscribe(activeItem => {
      this.activeItem = activeItem;
    });

    //Laufende Playlist abbonieren
    this.bs.getFiles().subscribe(files => this.files = files);
  }

  //einzelnes Item abspielen
  playSingleItem(item) {

    //aktuellen Modus auslesen (hsp vs. kindermusik)
    let mode = this.mode$.getValue();

    //Bei Audio
    if (this.appMode === "audio") {

      //aktuellen Wert fuer allowRandom holen
      let allowRandom = this.allowRandom$.getValue();

      //Message an WSS welches Verzeichnis abgespielt werden sollen und ob random erlaubt ist
      this.bs.sendMessage({
        type: "set-playlist",
        value: {
          mode: mode,
          path: item.mode + "/" + item.file,
          allowRandom: allowRandom
        }
      });

      //Ansicht auf Playlist umstellen
      this.vcs.setView('playlist');
    }

    //Video-Mode
    else {

      //Video-Playback starten oder neuen Titel enquen
      this.bs.sendMessage({
        type: "add-to-video-playlist", value: {
          "mode": mode,
          "path": item.mode + "/" + item.file,
          "name": item.name
        }
      });
    }
  }
}