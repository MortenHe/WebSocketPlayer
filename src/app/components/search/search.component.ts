import { Component } from '@angular/core';
import { BackendService } from '../../services/backend.service';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment'
import { ResultfilterService } from '../../services/resultfilter.service';
import { ViewControlService } from '../../services/view-control.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})

export class SearchComponent {

  //video vs. audio
  appMode = environment.appMode;

  //Name der App fuer Ueberschrift (z.B. Video Player (dev))
  envName = environment.envName;

  //dev vs. produktiv
  production = environment.production;

  //Zustand ob Verbindung zu WSS existiert
  connected: boolean;

  //ist random playback erlaubt bei laufender Playlist?
  allowRandomRunning$;

  //Position in Playlist
  position: number = -1;

  //Shutdown Status
  shutdown$;

  //Welcher Bereich (Suche, Playlist) ist gerade aktiv und somit sichtbar
  activeView: string;

  //Aktuelle Playlist
  files: string[] = [];

  //Anzahl der Sekunden bis Shutdown
  countdownTime: number;

  //Services und Router injecten
  constructor(private bs: BackendService, private route: ActivatedRoute, private router: Router, private fs: ResultfilterService, private vcs: ViewControlService) {
  }

  //Beim Init
  ngOnInit() {

    //Komplettliste der Items in Service laden
    this.bs.loadFullItemlist();

    //AllowRandom abonnieren (fuer Anzeige gewisser Komponenten)
    this.allowRandomRunning$ = this.bs.getAllowRandomRunning();

    //immer wenn sich die Route /serach/kinder -> /search/jahresvideo aendert
    this.route.paramMap.subscribe(params => {

      //Modus (kinder vs. jahresvideo) aus URL-Parameter auslesen
      let mode = params.get('mode');

      //Modes, die es in der der Config gibt
      let domainModes = environment.domainModes.map(domainMode => { return domainMode.id });

      //Wenn es diesen Modus nicht gibt
      if (domainModes.indexOf(mode) === -1) {

        //zu 1. Modus aus Config navigieren
        this.router.navigate(['/search', environment.domainModes[0].id]);
      }

      //Modus per Service setzen
      this.bs.setMode(mode);
    });

    //Position in Playlist abbonieren
    this.bs.getPosition().subscribe(position => this.position = position);

    //activeView (search vs. playlist) abbonieren
    this.vcs.getView().subscribe(view => this.activeView = view);

    //files (=Playlist) abonnieren
    this.bs.getFiles().subscribe(files => this.files = files);

    //Anzahl der Sekunden bis Shutdown abbonieren
    this.bs.getCountdownTime().subscribe(countdownTime => this.countdownTime = countdownTime);

    //Shutdown Zustand abbonieren
    this.shutdown$ = this.bs.getShutdown();

    //Zustand abbonieren, ob Verbindung zu WSS besteht
    this.bs.getConnected().subscribe(connected => this.connected = connected);

    //Regelmassieg eine Nachricht an WSS schicken, damit ggf. die Verbindung wieder aufgebaut wird
    setInterval(() => {
      this.bs.sendMessage({
        type: "ping",
        value: ""
      });
    }, 1500);
  }

  //Zwischen Views umschalten (Playlist, Search)
  setActive(view) {
    this.vcs.setView(view);
  }
}