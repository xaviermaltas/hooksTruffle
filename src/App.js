import React, { useState, useEffect } from "react";
import logo from './logo.svg';
import "./App.css";
import Panel from "./components/Panel/Panel";
// import Web3 from 'web3';
import getWeb3 from "./getWeb3.js";
import ElectionContract from "./election";
import { VotationService } from "./votationService";
import detectEthereumProvider from '@metamask/detect-provider';
import Spinner from 'react-spinner-material';
import MetaMaskOnboarding from '@metamask/onboarding'


// const isMetaMaskInstalled = () => {
//   const { ethereum } = window
//   return Boolean(ethereum && ethereum.isMetaMask)
// }

function App() {

  let accounts


  const onboardButton = document.getElementById('connectButton')
  const ONBOARD_TEXT = 'Click here to install MetaMask!';
  const CONNECT_TEXT = 'Connect';
  const CONNECTED_TEXT = 'Connected';
  const onboarding = React.useRef();

  const currentUrl = new URL(window.location.href)
  const forwarderOrigin = currentUrl.hostname === 'localhost'
    ? 'http://localhost:9010'
    : undefined

  const initialState = 
  {
    // balance: 0,
    account: undefined,
    candidates : [ 
      { id : 0, name : "Nemo", voteCounter : 9 },
      { id : 1, name : "Dory", voteCounter : 4 },
      { id : 2, name : "Alexander", voteCounter: 5}, 
    ],
    hasVoted : false,
    voterStatus : 'Has not voted yet',
    network : undefined,
    chain : undefined,
    isMetamask : undefined,
    isConnected : undefined
  };

  
  const [state, setState] = React.useState(initialState);

  //Onboard button
  const [buttonText, setButtonText] = React.useState(ONBOARD_TEXT);
  const [isDisabled, setDisabled] = React.useState(false);

  const [votationService, setVotationService] = React.useState(null);

  // React.useEffect( async () => {
    
  //   console.log('Before initProvider() ');

  //   await initProvider();
  // });

  React.useEffect(() => {
    if (!onboarding.current) {
      onboarding.current = new MetaMaskOnboarding();
    }
  }, []);

  React.useEffect( () => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()){
      
      function handleAccounts(newAccounts){
        if(newAccounts && newAccounts.length > 0){
          setState(state => ({ ...state, isConnected : true }));
          setState(state => ({ ...state, account : newAccounts[0] }));
          console.log('Connected');
        }
        else{
          setState(state => ({ ...state, isConnected : false }));
          console.log('Not connected');
        }
      }

      setState(state => ({ ...state, isMetamask : true }));
      window.ethereum
        .request({method : 'eth_requestAccounts' })
        .then(handleAccounts);
    }
    else {
      setState(state => ({ ...state, isMetamask : false }));
      console.log('Install Metamask');
    }

  }, []);

  React.useEffect( () => {
    function handleNewAccounts(newAccounts) {
      console.log(newAccounts[0]);
      setState(state => ({ ...state, account : newAccounts[0] }));
    }

    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then(handleNewAccounts);
      window.ethereum.on('accountsChanged', handleNewAccounts);
      return () => {
        window.ethereum.off('accountsChanged', handleNewAccounts);
      };
    }
  }, []);

  React.useEffect( () => {
    function handleNewChain(newChain) {
      console.log(newChain);
      setState(state => ({ ...state, chain : newChain }));
    }

    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      window.ethereum
        .request({ method: 'eth_chainId' })
        .then(handleNewChain);
        
      window.ethereum.on('chainChanged', handleNewChain)
      return () => {
        window.ethereum.off('chainChanged', handleNewChain);
      };
    }
    

  }, []);

  React.useEffect( () => {
    function handleNewNetwork(newNetwork) {
      console.log(newNetwork);
      setState(state => ({ ...state, network : newNetwork }));
    }

    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      window.ethereum
        .request({ method: 'net_version' })
        .then(handleNewNetwork);
        
      window.ethereum.on('networkChanged', handleNewNetwork)
      return () => {
        window.ethereum.off('networkChanged', handleNewNetwork);
      };
    }

  }, []);

  React.useEffect( async () => {
    /**
     * Contract Instance
    */

    if(MetaMaskOnboarding.isMetaMaskInstalled()){
    
      try{

        //Here we define an Instance of our Election Smart Contract
          let electionInstance = await ElectionContract(window.ethereum);

        //Creation of an instance of VotationService class
          let vS = new VotationService(electionInstance);

          getCandidates(vS);
          // getVoterStatus(vS, state.account);

      /**
       * Subscripcio a un event de votacio
      */
        let voteEmited = electionInstance.VoteEmited();
        // console.log(voteEmited);
        voteEmited.watch( function(error, result) {

          if(!error){
              const{ voter, candidateId , candidateName} = result.args;
              console.log(voter);

              if( voter === state.account ){
                this.container.success('You voted to ' + candidateName +' with ID : ' + candidateId , 'Votation');
                console.log('The voter ' + voter + ', voted to : ' + candidateName + ' with ID : ' + candidateId);
                // getVoterStatus(votationService);
              }

          }
          else{
            console.log("App.js Error");
            console.log(error);
          }

        }.bind(this));
      }
      catch (error) {
        console.error(error);
      }
    }

  }, []);

  const getCandidates = async (votationService) => {
    let candidates = await votationService.getCandidates();
    setState(state => ({ ...state, candidates : candidates }));
  } 

  // async function getCandidates(votationService){
  //   let candidates = await votationService.getCandidates();
  //   setState(state => ({ ...state, candidates : candidates }));
  // }

  const getVoterStatus = async (votationService, account) => {
    let output;
    try {
      const hasVoted = await votationService.hasVoted(account);
      console.log(hasVoted);
      output = hasVoted;
    }
    catch(err){
      console.error(err);
      output = false;
    }
    return output;
  }
 

  // async function getVoterStatus(votationService){
  //   //Getting information if the user has or not voted
    
  //   const hasVoted = await votationService.hasVoted(state.account);
  //   // console.log(hasVoted);
  //   setState(state => ({ ...state, hasVoted : hasVoted }));

  //   if(state.hasVoted){
  //       console.log("Has voted");
  //       let selectedCandidateId = await (votationService.getVoterElection(state.account));
  //       console.log('Selected Candidate ID: '+ selectedCandidateId);

  //       let candidateArray = state.candidates;

  //       let selectedCandidateName = await candidateArray[selectedCandidateId-1].name;
  //       console.log(selectedCandidateName);

  //       setState(state => ({ ...state, voterStatus : 'You have voted for ' + selectedCandidateName + ' with ID : ' + (selectedCandidateId) }));
  //   }
  //   else{
  //       // console.log("has not voted yet");
  //     setState(state => ({ ...state, voterStatus : 'Has not voted yet' }));
  //   }
  // }

  const converter = (web3) =>{
    return(value) => {
      return web3.utils.fromWei(value.toString(), 'ether');
    }
  }

  const voteForACandidate = async () => {

    var x = document.getElementById("candidatesSelect").selectedIndex;
    var y = document.getElementById("candidatesSelect").options;

    var candidateId = ((y[x].index)+1);
    var candidateName =  y[x].text;

    alert("Your vote is for : " + (candidateName) + " with index " + (candidateId));

    // await votationService.voteForACandidate( (candidateId), state.account );

    let selectedCandidateName = state.candidates[(candidateId-1)].name;

    setState(state => ({ ...state, voterStatus : 'You have voted for : ' + selectedCandidateName }));
    
    // await getCandidates();
  }
  

  /**
   * Components
  */
  
  const JumbotronUI = ({title}) => (
    <div className="jumbotron">
      <h4 className="display-4">{title}</h4>
    </div>
  );

  const UserInformationUI = ({account, voterStatus}) => (
    <div id = "yourAccount" className = "row">
      <div className = "col-sm">
        <Panel title={"Your Account"}>
          
          <div className="userInformation row">
            <div className="col-sm">
              <p><strong> Address : </strong>{account} </p>
              {/* <p><strong> Balance : </strong> {balance} ETH</p> */}
              <p><strong> Status :  </strong> {voterStatus} </p>
            </div>
          </div>

        </Panel>
      </div>
    </div>
  );

  const CandidatesTable = ({candidates}) => (
    candidates.map( (candidate,i) => {
      return <tr key = {i}>
        <td>{candidate.id}</td>
        <td>{candidate.name}</td>
        <td>{candidate.voteCounter}</td>
      </tr>
    })
  );

  const VotationResultsUI = ({candidates}) => (
    <div id = "votationResults" className = "row">
      <div className = "col-sm">
          <Panel title = {"Votation Results"} >
            
            <table className="table">
                <thead>
                  <tr>
                  <th scope="col">#</th>
                  <th scope="col">Name</th>
                  <th scope="col">Votes</th>
                  </tr>
                </thead>
                <tbody id="candidatesResults">
                  <CandidatesTable candidates={candidates}/>
                </tbody>
            </table>


          </Panel>
      </div>
    </div>
  );
                  
  const VotationAreaUI = ({candidates, voteForACandidate}) => (
    <div id = "votationArea" className = "row">
        <div className = "col-sm">
  
  
          <Panel title = {"Votation Area"}> 
            <form>
              <div className="form-group">
                  <label>Select Candidate</label>
                  <select className="form-control" id="candidatesSelect">
                      {
                        candidates.map( (candidate, i) => {
                            return <option value = {i} key = {i}>{candidate.name}</option>
                        })
                      }
                  </select>
              </div>
  
              <button type = "button" className="btn btn-primary" onClick={() => voteForACandidate()}>Vote</button>
  
            </form>
          </Panel>
  
  
        </div>
    </div>
  );

  const NetworkAreaUI = ({network,chain}) => (
    <div id = "network" className = "row">
        <div className = "col-sm">
            <Panel title={"Network"}>
              <div className="netInformation row">
                  <div className="col-sm">
                    <p><strong> Network : </strong> {network} </p>
                  </div>
              </div>

              <div className="chainInformation row">
                  <div className="col-sm">
                    <p><strong> Chain : </strong> {chain} </p>
                  </div>
              </div>

            </Panel>
        </div>
    </div>
  );

  const VotingWebApp = ({isMetamask, isConnected, network, chain, account, voterStatus, candidates, voteForACandidate}) => {
    if((isMetamask && isConnected) ){
      // console.log('VotingWebApp Loader');
      return(
        <div className="VotingWebApp">
          <JumbotronUI title={"Voting Application"}/>

          <NetworkAreaUI
              network={network}
              chain={chain}
          />
          <UserInformationUI 
              account={account} 
              voterStatus={voterStatus} 
          />

          <VotationResultsUI 
              candidates={candidates} 
          />

          <VotationAreaUI 
              candidates={candidates} 
              voteForACandidate={voteForACandidate}
          />     

        </div>
      );
    }

    return null;

  }

  const PageLoader = ({isMetamask, isConnected}) => {

    if(!(isMetamask && isConnected)){

      return (
        <div className="pageloader" id="pageloader" className="container-fluid">

            <div id="logo-container">
              <img id="mm-logo" src="/assets/img/metamask-fox.svg" />
            </div>

            <div className="spinner-loading-container">
        
              {/* <Spinner size={120} spinnerColor={"#333"} spinnerWidth={2} visible={true} /> */}
              <Spinner size={120} visible={true} />
                
            </div>

            <section>
                <div className="row d-flex justify-content-center">
                    <div className="col-xl-4 col-lg-6 col-md-12 col-sm-12 col-12">
                        <div className="card">

                            <div className="card-body">
                                <h4 className="card-title">
                                    Permissions Actions
                                </h4>

                                <button
                                    className="btn btn-primary btn-lg btn-block mb-3"
                                    id="connectButton"
                                    disabled
                                    >
                                    Connect
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-primary btn-lg btn-block mb-3"
                                    id="requestPermissions"
                                    onClick={() => this.requestPermissions()}
                                    >
                                    Request Permissions
                                </button>

                                <p className="info-text alert alert-secondary">
                                    Permissions result: <span id="permissionsResult"></span>
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </section>


        </div>
      );

    }

    return null;
    
  }
     
  return (

    <React.Fragment>

      <div className="app">

        <PageLoader 
          isMetamask={state.isMetamask} 
          isConnected={state.isConnected} 
          // isMetamask={false} 
          // isConnected={false}
        />

        <VotingWebApp 
          isMetamask={state.isMetamask} 
          isConnected={state.isConnected}
          network={state.network}
          chain={state.chain}
          account={state.account}
          voterStatus={state.voterStatus}
          candidates={state.candidates}
          voteForACandidate={voteForACandidate}
        />

      </div>
      
    </React.Fragment>

  );
}

export default App;