document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = () => {
    
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value,
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      if (result["error"]) {
        console.log(result["error"]);
      }
      else {
        load_mailbox('sent')
      }
    });
  return false;
  };
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      emails.forEach(email => {
        //do not display archived emails in the sent mailbox
        if (mailbox === "sent" && email["archived"] === true){
          return;
        }
        //create cards for email display
        const card_div = document.createElement('div');
        card_div.setAttribute("class", `card read-${email["read"]}`);
        card_div.setAttribute("id", `email-card`);
        card_div.addEventListener('click', (e) => {
          load_email(email);
        });

        //create archive button for the email cards
        const archive = document.createElement('button');
        archive.setAttribute("class", "btn btn-outline-secondary float-right");
        archive.setAttribute("id", "archive-mailbox");
        archive.innerHTML = `${email["archived"] ? "Unarchive" : "Archive"}`
        archive.addEventListener('click', (e) => {
          e.stopPropagation(); //to prevent from listening to click on card_div
          fetch(`emails/${email["id"]}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: !email["archived"],
            })
          })
          .then(() => load_mailbox("inbox"));
        });

        card_div.innerHTML = `
          <div class="card-header">${email["sender"]}
          </div>
          <div class="card-body">
            <blockquote class="blockquote mb-0">
              <p>${email["subject"]}</p>
              <footer class="blockquote-footer">${email["timestamp"]}</footer>
            </blockquote>
          </div>
        `;
        //insert archive button into the header of email
        card_div.firstElementChild.append(archive);
        //insert the whole email card into the emails-viewe
        document.querySelector('#emails-view').append(card_div);
      }
  )});
}

function load_email(email) {
  // Show the single email and hide other views
  document.querySelector('#single-view').style.display = 'none';
  document.querySelector('#single-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  //set the read atribute of the email
  fetch(`emails/${email["id"]}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })

  //display the single email
  const card_div = document.createElement('div');
  card_div.setAttribute("class", `card`);
  card_div.setAttribute("id", `email-card`);
  card_div.innerHTML = `
    <div>
      <h6 class="card-header">From: ${email["sender"]}</h6>
      <h6 class="card-header">To: ${email["recipients"]}</h6>
      <h6 class="card-header">Subject: ${email["subject"]}</h6>
      <h6 class="card-header">Time Sent: ${email["timestamp"]}</h6>
      <div class="card-body">
      <span>${email["body"].replace(/\n/g, "<br />")}</span>
      </div>
    </div>
    <hr>
    <button class="btn btn-outline-secondary" id="reply">Reply</button>
    <button class="btn btn-outline-secondary" id="archive">${email["archived"] ? "Unarchive" : "Archive" }</button>
  `;
  document.querySelector('#single-view').innerHTML = ""; //clear the previous contents
  document.querySelector('#single-view').append(card_div); 

  //click on the archive button
  document.querySelector('#archive').addEventListener('click', () => {
    fetch(`emails/${email["id"]}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: !email["archived"],
      })
    })
    .then(() => load_mailbox("inbox"));
  });

  //click on the reply button
  document.querySelector('#reply').addEventListener('click', () => {
    compose_email();
    document.querySelector('#compose-recipients').value = email["sender"];
    document.querySelector('#compose-body').value = `On ${email["timestamp"]} ${email["sender"]} wrote: \n ${email["body"]} \n \n`
    let subject = email["subject"];
    if (subject.slice(0,4) != "Re: "){
      subject = `Re: ${subject}`;
    }
    document.querySelector('#compose-subject').value = subject; 
  });

  



}