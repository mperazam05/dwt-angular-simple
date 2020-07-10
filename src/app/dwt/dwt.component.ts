import { Component, OnInit } from '@angular/core';
import Dynamsoft from 'dwt';
import { WebTwain } from 'dwt/WebTwain';

@Component({
  selector: 'app-dwt',
  templateUrl: './dwt.component.html',
  styleUrls: ['./dwt.component.css']
})
export class DwtComponent implements OnInit {
  DWObject: WebTwain;
  selectSources: HTMLSelectElement;
  containerId = 'dwtcontrolContainer';
  bWASM = Dynamsoft.Lib.env.bMobile || Dynamsoft.WebTwainEnv.UseLocalService;
  constructor() { }

  ngOnInit(): void {
    Dynamsoft.WebTwainEnv.Containers = [{ WebTwainId: 'dwtObject', ContainerId: this.containerId, Width: '300px', Height: '400px' }];
    Dynamsoft.WebTwainEnv.RegisterEvent('OnWebTwainReady', () => { this.Dynamsoft_OnReady(); });
    Dynamsoft.WebTwainEnv.ProductKey = 't01074wAAABu6b/2CX+HyDhSY7UU9BlKVsM4ZHLlZFNhShY9CcjEG2ZBUxEg0MJliNDxRbpW64DFHK48nFNTKdiCLwMMSpVj8GEgEYrcNjaapy5THnD4mzR+NqsBNMzOAOihfgDWmkg/RCzt5LeA=';
    Dynamsoft.WebTwainEnv.ResourcesPath = 'assets/dwt-resources';
    let checkScript = () => {
      if (Dynamsoft.Lib.detect.scriptLoaded) {
        this.modulizeInstallJS();
        Dynamsoft.WebTwainEnv.Load();
      } else {
        setTimeout(() => checkScript(), 100);
      }
    };
    checkScript();
  }
  /**
   * Dynamsoft_OnReady is called when a WebTwain instance is ready to use.
   * In this callback we do some initialization.
   */
  Dynamsoft_OnReady(): void {
    this.DWObject = Dynamsoft.WebTwainEnv.GetWebTwain(this.containerId);
    if (this.bWASM) {
      this.DWObject.MouseShape = true;
      this.createInputForWASM();
    } else {
      let count = this.DWObject.SourceCount;
      this.selectSources = <HTMLSelectElement>document.getElementById("sources");
      this.selectSources.options.length = 0;
      for (let i = 0; i < count; i++) {
        this.selectSources.options.add(new Option(this.DWObject.GetSourceNameItems(i), i.toString()));
      }
    }
  }
  /**
   * Acquire images from scanners or cameras or local files
   */
  acquireImage(): void {
    if (!this.DWObject)
      this.DWObject = Dynamsoft.WebTwainEnv.GetWebTwain();
    if (this.bWASM) {
      if (document.getElementById(this.containerId + "-fileInput")) {
        (<HTMLInputElement>document.getElementById(this.containerId + "-fileInput")).value = "";
        document.getElementById(this.containerId + "-fileInput").click();
      } else {
        this.createInputForWASM().then(_ => {
          if (document.getElementById(this.containerId + "-fileInput")) {
            (<HTMLInputElement>document.getElementById(this.containerId + "-fileInput")).value = "";
            document.getElementById(this.containerId + "-fileInput").click();
          }
        });
      }
    }
    else if (this.DWObject.SourceCount > 0 && this.DWObject.SelectSourceByIndex(this.selectSources.selectedIndex)) {
      const onAcquireImageSuccess = () => { this.DWObject.CloseSource(); };
      const onAcquireImageFailure = onAcquireImageSuccess;
      this.DWObject.OpenSource();
      this.DWObject.AcquireImage({}, onAcquireImageSuccess, onAcquireImageFailure);
    } else {
      alert("No Source Available!");
    }
  }
  /**
   * Open local images.
   */
  openImage(): void {
    if (!this.DWObject)
      this.DWObject = Dynamsoft.WebTwainEnv.GetWebTwain('dwtcontrolContainer');
    this.DWObject.IfShowFileDialog = true;
    /**
     * Note, this following line of code uses the PDF Rasterizer which is an extra add-on that is licensed seperately
     */
    this.DWObject.Addon.PDF.SetConvertMode(Dynamsoft.EnumDWT_ConvertMode.CM_RENDERALL);
    this.DWObject.LoadImageEx("", Dynamsoft.EnumDWT_ImageType.IT_ALL,
      () => {
        //success
      }, () => {
        //failure
      });
  }
  /**
   * Workaround on making a input for WASM mode.
   */
  createInputForWASM(): Promise<any> {
    return new Promise((res, rej) => {
      try {
        let WASMInput = document.createElement("input");
        WASMInput.style.position = "fixed";
        WASMInput.style.top = "-1000px";
        WASMInput.setAttribute("multiple", "multiple");
        WASMInput.setAttribute("id", this.containerId + "-fileInput");
        WASMInput.setAttribute("type", "file");
        WASMInput.onclick = _ => {
          let filters = [], filter = "";
          filters.push("image/jpeg");
          filters.push("image/png");
          filters.push("image/tiff");
          filters.push("application/pdf");
          if (filters.length > 0) {
            filter = filters.join(",");
          }
          WASMInput.setAttribute("accept", filter);
        }
        WASMInput.onchange = evt => {
          let _input = <HTMLInputElement>evt.target;
          let files = _input.files;
          for (let i = 0; i < files.length; i++) {
            this.DWObject.LoadImageFromBinary(files[i], () => { console.log('Successful!'); }, (errCode, errString) => { alert(errString); })
          }
        };
        document.getElementById('container').appendChild(WASMInput);
        res(true);
      } catch (err) {
        rej(err);
      }
    });
  }
  /**
   * To make dynamsoft.webtwain.install.js compatible with Angular
   */
  modulizeInstallJS() {
    let _DWT_Reconnect = (<any>window).DWT_Reconnect;
    (<any>window).DWT_Reconnect = (...args) => _DWT_Reconnect.call({ Dynamsoft: Dynamsoft }, ...args);
    let __show_install_dialog = (<any>window)._show_install_dialog;
    (<any>window)._show_install_dialog = (...args) => __show_install_dialog.call({ Dynamsoft: Dynamsoft }, ...args);
    let _OnWebTwainOldPluginNotAllowedCallback = (<any>window).OnWebTwainOldPluginNotAllowedCallback;
    (<any>window).OnWebTwainOldPluginNotAllowedCallback = (...args) => _OnWebTwainOldPluginNotAllowedCallback.call({ Dynamsoft: Dynamsoft }, ...args);
    let _OnWebTwainNeedUpgradeCallback = (<any>window).OnWebTwainNeedUpgradeCallback;
    (<any>window).OnWebTwainNeedUpgradeCallback = (...args) => _OnWebTwainNeedUpgradeCallback.call({ Dynamsoft: Dynamsoft }, ...args);
    let _OnWebTwainPreExecuteCallback = (<any>window).OnWebTwainPreExecuteCallback;
    (<any>window).OnWebTwainPreExecuteCallback = (...args) => _OnWebTwainPreExecuteCallback.call({ Dynamsoft: Dynamsoft }, ...args);
    let _OnWebTwainPostExecuteCallback = (<any>window).OnWebTwainPostExecuteCallback;
    (<any>window).OnWebTwainPostExecuteCallback = (...args) => _OnWebTwainPostExecuteCallback.call({ Dynamsoft: Dynamsoft }, ...args);
    let _OnRemoteWebTwainNotFoundCallback = (<any>window).OnRemoteWebTwainNotFoundCallback;
    (<any>window).OnRemoteWebTwainNotFoundCallback = (...args) => _OnRemoteWebTwainNotFoundCallback.call({ Dynamsoft: Dynamsoft }, ...args);
    let _OnRemoteWebTwainNeedUpgradeCallback = (<any>window).OnRemoteWebTwainNeedUpgradeCallback;
    (<any>window).OnRemoteWebTwainNeedUpgradeCallback = (...args) => _OnRemoteWebTwainNeedUpgradeCallback.call({ Dynamsoft: Dynamsoft }, ...args);
    let _OnWebTWAINDllDownloadFailure = (<any>window).OnWebTWAINDllDownloadFailure;
    (<any>window).OnWebTWAINDllDownloadFailure = (...args) => _OnWebTWAINDllDownloadFailure.call({ Dynamsoft: Dynamsoft }, ...args);
  }
}
