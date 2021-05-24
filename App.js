//Copyright 2021 Jack Berendt/GoodSchool. Code may be used freely with credit.
import './App.css';
import React, {Component, useEffect, useState} from "react";
import firebase from "firebase";
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import Popup from 'reactjs-popup';
import Button from '@material-ui/core/Button';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import Input from '@material-ui/core/Input'
const config = {
  apiKey: 'YOUR API KEY',
  authDomain: 'YOUR AUTHDOMAIN',
  projectId: "YOUR PROJECTID",
}
firebase.initializeApp(config);
const uiConfig = { 
  signInFlow: 'popup',
  signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID,
    //firebase.auth.GoogleAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: () => false,
  },
};
function SignIn() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  useEffect(() => {
    const unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
      setIsSignedIn(!!user);
    });
    return () => unregisterAuthObserver();
  }, []);
  if (!isSignedIn) {
    return (
      <div class='loginpage'>
        <h1 id='logintitle'>Welcome to GoodSchool!</h1>
        <h2>Sign in or sign up here.</h2>
        <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
        <p>GoodSchool is an open-source, free, and fast alternative to products like Google Classroom and Apple Classroom. Copyright 2021 Jack Berendt.</p>
        <p>Warning: this is the first alpha version. The whole project was made in one week. Use at your own risk!</p>
        <a href={'https://github.com/jrberendt/goodschool'}>Code on Github</a>
      </div>
    );
  }
  return (
    <App/>
  );
}
function createClass(classname){
  if (classname !== ''){
  firebase.database().ref('classes/' + firebase.auth().currentUser.uid + '/' + classname + '/teacher').set(firebase.auth().currentUser.displayName).catch(error => {console.log(error.message)})
  firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/' + firebase.auth().currentUser.uid + '-' + classname).set("Teacher|").catch(error => {console.log(error.message)})
  window.location.reload();
  }else{
    alert("Could not create classroom with empty name")
  }
}
function joinClass(classcode){
  if(classcode !== undefined && classcode !== '' && classcode.includes('-') !== false){
  var uid = classcode.split('-')
  if (uid[0] !== firebase.auth().currentUser.uid){
  firebase.database().ref('classes/' + uid[0] + "/" + uid[1] + "/students/" + firebase.auth().currentUser.displayName).set(firebase.auth().currentUser.displayName).catch(error => {console.log(error.message)})
  firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/' + classcode).set('Student|').catch(error => {console.log(error.message)})
  window.location.reload();
  } else{
    alert("You cannot be a student of your own class!")
  }
}else{
  alert('Entered incorrect classcode.')
}}
function deleteItem(uid, classroom, classcode){
  if(window.confirm("You are about to delete this class. Are you sure?")){
    firebase.database().ref('classes/' + uid.trim() + "/" + classroom).remove().catch(error => console.log(error.message))
    firebase.database().ref('users/' + uid.trim() + "/" + classcode).remove().catch(error => console.log(error.message))}
    window.location.reload()
}
function removePerson(classcode){
  let uid = classcode.split('-')
  firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/' + classcode).remove().catch(error => console.log(error.message))
  firebase.database().ref('classes/' + uid[0] + '/' + uid[1] + '/students/' + firebase.auth().currentUser.displayName).remove().catch(error => console.log(error.message))
  window.location.reload()
}
function deleteUser(classcode){
  if(window.confirm("You are about to delete your account and all of the data with it.")){
    firebase.database().ref('users/' + firebase.auth().currentUser.uid).remove().catch(error => console.log(error.message));
    firebase.database().ref('classes/' + firebase.auth().currentUser.uid).remove().catch(error => console.log(error.message));
    var user = firebase.auth().currentUser;
    user.delete().then(function() {
    }).catch(function(error) {
      alert("You need to sign in again before this can happen. Enter your credidentials, and then delete your account.")
      firebase.auth().signOut().then(function() {
        if (classcode !== [null]){
        classcode.map(x => removePerson(x))}
      }, function(error) {
        console.error('Sign Out Error', error);
      });});}}

class App extends Component {
  state = {
    name: '',
    code: '',
    classes: [''],
    classname: [''],
    persontype: [''],
    uids: [''],
    teacherList: [],
    studentList: [],
    classData: [],
    description: '',
    title: '',
    comment: '',
    link: '',
    links: [],
  };
  handleClasses = () => {
    let str = '';
    firebase.database().ref('users/' + firebase.auth().currentUser.uid).on('value', snapshot => {
      for (var k in snapshot.val()) {
        if (snapshot.val().hasOwnProperty(k)) {
          str += k + ':' + snapshot.val()[k] + '\n';
        }
      }
      let classeslist = str.split("|")
      let joincode1 = classeslist.map(x => x.split(':'))
      joincode1 = joincode1.map(x => x[0])
      this.setState({
        classes: joincode1
      })
      classeslist = classeslist.map(x => x.split('-'));
      let uids = classeslist.map(x => x[0]);
      this.setState({
        uids: uids
      })
      classeslist = classeslist.map(x => x[1]);
      classeslist.pop();
      classeslist = classeslist.map(x => x.split(':'))
      this.setState({
        classname: classeslist.map(x => x[0]),
        persontype: classeslist.map(x => x[1])
      })
      this.setState({
        teacherList: []
      })
      joincode1 = joincode1.map(x => x.replace('\n', ''))
      joincode1.map(x => {if (x !== ''){firebase.database().ref("classes/" + x.replace('-', '/') + '/teacher').on('value', (snapshot) => {  
        this.setState(prevState => ({
          teacherList: [...prevState.teacherList, snapshot.val()]
        }))
      })}})
      joincode1.map(x => {if (x !== ''){firebase.database().ref('classes/' + x.replace('-', '/') + '/students').on('value', (snapshot) => {
        if(snapshot.val() === null){
          this.setState(prevState => ({
            studentList: [...prevState.studentList, ['No students.']] 
          }))
        }
        else{
          this.setState(prevState => ({
            studentList: [...prevState.studentList, Object.values(snapshot.val())]
          }))
        }
      })}})
      joincode1.map(x => {if (x !== ''){firebase.database().ref('classes/' + x.replace('-', '/') + '/data').on('value', (snapshot) => {
        if(snapshot.val() === null){
          this.setState(prevState => ({
            classData: [...prevState.classData, [['0', 'This class has no assignments or announcements.', '']]]
          }))
        }
        else{
          this.setState(prevState => ({
            classData: [...prevState.classData, Object.values(snapshot.val())],
          }))
        }
      })}})
    })   
    str = ''
  }
  componentDidMount() {
    this.handleClasses();
  }
  teacherDelete = (props) => {
    if (this.state.persontype[this.state.classname.indexOf(props.classcode)] === 'Teacher'){
      return(
        <Button onClick={() => deleteItem(this.state.uids[this.state.classname.indexOf(props.classcode)], props.classcode, this.state.classes[this.state.classname.indexOf(props.classcode)].trim())}>Delete Class</Button>
      )
    }
    else {
      return(
        <Button onClick={() => removePerson(this.state.classes[this.state.classname.indexOf(props.classcode)].trim())}>Leave Class</Button>
      )
    }
  }
  materialDelete = (classcode, title) => {
    if (title !== undefined){
    firebase.database().ref('classes/' + this.state.classes[this.state.classname.indexOf(classcode)].trim().replace('-', '/') + "/data/" + title).remove().catch(error => {console.log(error.message)})
    alert("Material deleted. The page will now reload.")
    window.location.reload()}
  }
  materialDeleteShow = (classcode, title) => {
    if (this.state.persontype[this.state.classname.indexOf(classcode)] === 'Teacher'){
      return(
        <Button onClick={() => this.materialDelete(classcode, title)}>Delete Material</Button>
      )
    }
    else{return(null)}  
  }
  handleCreate = event => {
    this.setState({ name: event.target.value });
    this.handleClasses();
  };
  handleJoin = event => {
    this.setState({ code: event.target.value})
    this.handleClasses();
  }
  handleTitle = event => {
    this.setState({ title: event.target.value})
  }
  handleDesc = event => {
    this.setState({ description: event.target.value})
  }
  handleLinks = event => {
    this.setState({ link: event.target.value})
  }
  joinCodeShow = (props) => {
    if(this.state.persontype[this.state.classname.indexOf(props.classcode)] === "Teacher"){
      return(
        <Popup trigger={<Button id='showcodebutton'>Show join code</Button>} modal nested>
          <div class='options-popup'> 
            <p>Join Code for Students: {this.state.classes[this.state.classname.indexOf(props.classcode)]}</p>
            <CopyToClipboard text={this.state.classes[this.state.classname.indexOf(props.classcode)]}>
            <Button>Copy Code to Clipboard</Button>
            </CopyToClipboard>
          </div>
        </Popup>)}
      else{
      return(
        null
      )
    }
  }
  createClassData = (classnumber, classname) => {
    if (this.state.title !== ''){
    firebase.database().ref('classes/' + this.state.uids[classnumber].trim() + '/' + classname + '/data/' + Math.floor(Date.now() / 1000)).set([Math.floor(Date.now() / 1000), new Date().toLocaleString().replace(",","").replace(/:.. /," ") + ": " + this.state.title, this.state.description, this.state.links]).catch(error => {console.log(error.message)})
    alert('Assignment Created. The page will now reload.')
    window.location.reload();}
    else{
      alert('Titles cannot be blank.')
    }
  }
  handleComment = event => {
    this.setState({ comment: event.target.value})
  }
  comment = (classcode, data, material) => {
    if (data !== 'This class has no assignments or announcements.'){
    return(
      <div><Input onChange={this.handleComment} placeholder={'Write a comment'}></Input><Button onClick={() => {firebase.database().ref('classes/' + this.state.uids[this.state.classname.indexOf(classcode)].trim() + '/' + classcode + '/data/' +  material + '/comments/' + Math.floor(Date.now() / 1000)).set(firebase.auth().currentUser.displayName + ": " + this.state.comment).catch(error => {console.log(error)}).then(alert('Comment Created. Reloading Page.')).then(window.location.reload())}}>Comment</Button></div>
    )}
    else{
      return(null)
    }
  }
  commentList = (data) => {
    if(data.comments !== null && data.comments !== undefined){
      return(
        <div>
          <h4>Comments</h4>
          <ul>{Object.values(data.comments).map(comment => {return(<li>{comment}</li>)})}</ul>
        </div>
        )
    }
    else{
    return(null)}}
  listLinks = (data) => {
    if (data !== undefined){
    let links = data.map(link => {return(<li><a href={link}>{link}</a></li>)})
    return(<ul>{links}</ul>)}
    else{
      return(<p>No links or attachments.</p>)
    }
  }
  getClassData = (props) => {
    if(props.teacher === null){
      return(
        <div><p>This classroom has been deleted. Leave through the options tab.</p></div>
      )
    }
    else{
      let listClassData = [].concat(props.data).reverse().map((data) => {
        return(
        <li key={data[0]}>
        <Popup trigger={<Button>{data[1]}</Button>} modal nested><div id='options-popup'><h3>{data[1]}</h3><h4>{data[2]}</h4>{this.listLinks(data[3])}{this.comment(props.classcode, data[1], data[0])}{this.commentList(data)}{this.materialDeleteShow(props.classcode, data[0])}</div></Popup>
        </li>
      )
      })
    return(
      <div>
        <ul>{listClassData}</ul>
      </div>
    )}
  }
  studentList = (props) => {
    let listStudents = props.class.map((student) => 
    <li key={this.state.classname.indexOf(props.classes)}><p>{student}</p></li>
    )
    return(
      <ul>{listStudents}</ul>
    )
  }
  createMaterial = (props) => {
    if(this.state.persontype[this.state.classname.indexOf(props.classcode)] === 'Teacher'){return(
    <Popup trigger={<Button>Create Material</Button>} modal nested>
          <div id='options-popup'>
            <Input placeholder='Title of Material' onChange={this.handleTitle}></Input>
            <Input placeholder='Description' onChange={this.handleDesc}></Input>
            <Input placeholder='Add a link' onChange={this.handleLinks}></Input>
            <Button onClick={() => {this.setState(prevState => ({links: [...prevState.links, this.state.link]}))}}>Add Link</Button>
            <Button onClick={() => {this.createClassData(this.state.classname.indexOf(props.classcode), props.classcode)}}>Create Material</Button>
          </div>
          </Popup>)}
    else{
      return(null)
    }
  }
  render(){
  const listItems = this.state.classname.map((classcode) =>
    <li key={this.state.classname.indexOf(classcode)}>
      <Popup trigger={<div id='li'><h4 class='unselectable' className='button'>{classcode}</h4><p>Teacher: {this.state.teacherList[this.state.classname.indexOf(classcode)]}</p></div>} modal nested className='myPopup'>
        {close => (
      <div className="modal">
        <Button className="close" onClick={close}>✖️</Button> 
        <Popup trigger={<Button>Options</Button>} modal nested><div class='options-popup'><this.joinCodeShow classcode={classcode}/><this.teacherDelete  classcode={classcode} classes={this.state.classes}/></div></Popup>
        <Popup trigger={<Button>people</Button>} modal nesed>
          <div class='options-popup'>
            <h4>Teacher: {this.state.teacherList[this.state.classname.indexOf(classcode)]}</h4>
            <h4>Students:</h4><this.studentList class={this.state.studentList[this.state.classname.indexOf(classcode)]}/>
          </div>
        </Popup>
        <this.createMaterial classcode={classcode}/>
        <p id='classroomuser'>{firebase.auth().currentUser.displayName + " - " + this.state.persontype[this.state.classname.indexOf(classcode)]}</p>
        <div className="header"><h2>{classcode}</h2></div>
        <div className="content">
          <this.getClassData teacher={this.state.teacherList[this.state.classname.indexOf(classcode)]} classcode={classcode} data={this.state.classData[this.state.classname.indexOf(classcode)]}/>
          
        </div>
      </div>
    )}
      </Popup>
      </li>
  );
  return (
    <div class='App'>
      <div class='Header'>
      <h1 id='title'>GoodSchool</h1>
        <Popup trigger={<Button id='options'>Menu</Button>} position="left center" modal nested>
          <div id='options-popup'>
            <p>{firebase.auth().currentUser.displayName}</p>
            <Popup trigger={<Button>Create/Join Class</Button>} position= "center" modal nested>
            <div id='createjoin'>
              <div id='createclass'>
                <Input onChange={this.handleCreate} type='text' id='classtitle' placeholder='Classroom Name'/>
                <Button onClick={() => createClass(this.state.name)}>Create Class</Button>
              </div>
              <div id='joinclass'>
                <Input onChange={this.handleJoin} type='text' id='joincode' placeholder='Paste class join code'></Input>
                <Button onClick={() => joinClass(this.state.code.trim())}>Join Class</Button>
              </div>
            </div>
            </Popup>
            <Button id='signOut' onClick={() => firebase.auth().signOut().then(window.location.reload())}>Sign Out</Button>
            <Button onClick={() => deleteUser(this.state.classes)}>Delete Account</Button>
          </div>
        </Popup>  
      </div>
      <div class='content'>
        <ul>{listItems}</ul>
      </div>
    </div>
  );}}
export default SignIn;
