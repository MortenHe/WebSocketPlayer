import { Component } from '@angular/core';
import { BackendService } from '../../services/backend.service';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment'
import { ViewControlService } from '../../services/view-control.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})

export class SearchComponent {

  //dev vs. produktiv
  production = environment.production;

  //In welchem Bereich sind wir (hsp, cds, musik)
  mode = null;

  //welche ModeFilter gibt es (all, conni, janosch, misc)
  showModeFilterList: boolean = false;

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

  //Services und Router injecten
  constructor(private bs: BackendService, private route: ActivatedRoute, private router: Router, private vcs: ViewControlService) {
  }

  //Beim Init
  ngOnInit() {

    //Komplettliste der Items in Service laden
    this.bs.loadFullItemlist();

    //AllowRandom abonnieren (fuer Anzeige gewisser Komponenten)
    this.allowRandomRunning$ = this.bs.getAllowRandomRunning();

    //immer wenn sich die Route /serach/hsp -> /search/musikmh aendert
    this.route.paramMap.subscribe(params => {

      //Modus (hsp vs. musikmh) aus URL-Parameter auslesen
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

    //Modus abbonieren
    this.bs.getMode().subscribe(mode => this.mode = mode);

    //Liste der Modefilter abonnieren
    this.bs.getModeFilterList().subscribe(modeFilterlist => {

      //Wenn Filter mit Inhalt kommt (z.B. Beginn liefert BS null)
      if (modeFilterlist) {

        //Filteritems holen
        let modeFilterListItems = modeFilterlist["filters"];

        //Filter-Buttons nur anzeigen, wenn es neben "Alle" und "Sonstige" noch andere Filter gibt
        this.showModeFilterList = modeFilterListItems.some(elem => {
          return (elem.id !== 'all' && elem.id !== 'misc');
        });
      }

      //es kam null von BS
      else {
        return false;
      }
    });

    //Position in Playlist abbonieren
    this.bs.getPosition().subscribe(position => this.position = position);

    //activeView (search vs. playlist) abbonieren
    this.vcs.getView().subscribe(view => this.activeView = view);

    //files (=Playlist) abonnieren
    this.bs.getFiles().subscribe(files => this.files = files);

    //Shutdown Zustand abbonieren
    this.shutdown$ = this.bs.getShutdown();

    //Regelmassieg eine Nachricht an WSS schicken, damit ggf. die Verbindung wieder aufgebaut wird
    setInterval(() => {
      this.bs.sendMessage({
        type: "ping",
        value: ""
      });
    }, 1500);
  }
}