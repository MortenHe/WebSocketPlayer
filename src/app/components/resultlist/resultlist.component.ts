import { Component, OnInit } from '@angular/core';
import { Item } from '../../config/main-config';
import { BackendService } from '../../services/backend.service';
import { ResultfilterService } from '../../services/resultfilter.service';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { ViewControlService } from '../../services/view-control.service';

@Component({
  selector: 'resultlist',
  templateUrl: './resultlist.component.html',
  styleUrls: ['./resultlist.component.scss']
})

export class ResultlistComponent {

  //Modus hsp vs. kindermusik
  mode: string;

  //Itemliste als Observable. Wird in Template per async pipe ausgegeben
  items$: Observable<Item[]>;

  //Flag ob Tracks angezeigt werden sollen
  showTracks$: Observable<boolean>;

  //Ist Random erlaubt?
  allowRandom$: BehaviorSubject<boolean>;

  //Ist gerade random?
  random: boolean;

  //welches Item in der Liste wurde angeklickt?
  activeItem: string = "";

  //Modefilter
  modeFilter: string;

  //Suchterm fuer Markierung der Trefferliste
  searchTerm: string;

  //Sollen die Jokersymbole angezeigt werden?
  showJoker: boolean;

  //Wird gerade eine Joker Playlist kopiert?
  jokerLock: boolean = false;

  //welcher Joker wird gerade gesetzt?
  clickedJokerItem: any = null;

  //Services injecten
  constructor(private bs: BackendService, private fs: ResultfilterService, private vcs: ViewControlService) { }

  //beim Init
  ngOnInit() {

    //gefilterte und sortierte Itemliste per Service abbonieren
    this.items$ = this.bs.getFilteredItemlist();

    //flag ob Tracks angezeigt werden abbonieren
    this.showTracks$ = this.fs.getShowTracks();

    //Modus abbonieren
    this.bs.getMode().subscribe(mode => {
      this.mode = mode;
    });

    //AllowRandom abbonieren
    this.allowRandom$ = this.bs.getAllowRandom();

    //Random abbonieren
    this.bs.getRandom().subscribe(random => this.random = random);

    //ActiveItem abbonieren
    this.bs.getActiveItem().subscribe(activeItem => {
      this.activeItem = activeItem;
    });

    //ModeFilter (bibi, bibi-tina, all,...) abbonieren
    this.fs.getModeFilter().subscribe(modeFilter => this.modeFilter = modeFilter);

    //Suchterm abbonieren
    this.fs.getSearchTerm().subscribe(searchTerm => this.searchTerm = searchTerm);

    //Jokeranzeige abbonieren
    this.fs.getShowJoker().subscribe(showJoker => {
      this.showJoker = showJoker;
    });

    //Zustand der JokerErstellung abbonieren
    this.bs.getJokerLock().subscribe(jokerLock => {
      this.jokerLock = jokerLock;
    });
  }

  //einzelnes Item abspielen
  playSingleItem(item) {

    //aktuellen Wert fuer allowRandom holen
    let allowRandom = this.allowRandom$.getValue();

    //Message an WSS welches Verzeichnis abgespielt werden sollen und ob random erlaubt ist
    this.bs.sendMessage({
      type: "set-playlist",
      value: {
        name: item.name,
        mode: this.mode,
        path: item.mode + "/" + item.file,
        allowRandom: allowRandom
      }
    });

    //Ansicht auf Playlist umstellen
    this.vcs.setView('playlist');

    //Beim Starten oder Einreihen eines Items das Suchfeld leeren
    this.fs.setSearchTerm("");
  }

  //Die gewaehlte Playlist als Joker setzen, Lock setzen, um Oberflaeche zu blokieren (Wert kommt spaeter auch von WSS)
  setJoker(item) {
    this.jokerLock = true;

    //Joker-Item merken, damit dort ein Spinner-Symbol angezeigt werden kann
    this.clickedJokerItem = item;

    //Playlist als Joker setzen. mode und folder, damit auf Server geprueft werden kann, ob es einen Joker-Ordner fuer diese Serie gibt (z.B. hsp/00-pumuck-joker)
    this.bs.sendMessage({
      type: "set-joker",
      value: {
        wantedJokerFolder: this.mode + "/" + item.mode + "/" + item.file,
        mode: this.mode,
        folder: item.mode
      }
    });
  }
}