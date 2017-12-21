
In this section we show you how to deploy and use the tools to run simulations on AWS.


## Installation

Install python3 and pip3 on your local computer. We recommend that you use Linux.

### Deployment on AWS

#### Creating an AWS Account

To access any web service AWS offers, you must first create an AWS account at http://aws.amazon.com. An AWS account is simply an Amazon.com account that is enabled to use AWS products; you can use an existing Amazon.com account login and password when creating the AWS account. ([source](http://docs.aws.amazon.com/AmazonSimpleDB/latest/DeveloperGuide/AboutAWSAccounts.html))
If you already have one, just log in to the [AWS Management Console](https://console.aws.amazon.com) with it, and ignore the rest of this section.
Otherwise, follow the instructions here: [AWS registration](https://portal.aws.amazon.com/gp/aws/developer/registration/index.html)

#### Creating the Access Policy

On the AWS Management Console, navigate to the IAM Service configuration page, and switch to **Policies**. Or just
click [this link](https://console.aws.amazon.com/iam/home#/policies), it will take you there.
Click the **Create policy** button. Switch over to the **JSON** tab. Paste the contents of [this file](docker-for-aws-policy.json) into the entry field.

This policy is the superset of the officially published one on the [Docker for AWS website](https://docs.docker.com/docker-for-aws/iam-permissions/). It had to be slightly altered to make it fit into the default size limit, so it grants slightly more privileges than necessary.
It also adds the ec2:CreateKeyPair permission, and the cloudwatch:PutMetricAlarm. This is necessary to automate the connection to the swarm, and the shutting down of the machines after they have been idle for a while.

Click **Review policy**. Enter a **Name** for the new policy, for example "inet-docker-swarm-policy", then click **Create policy**.

#### Creating the User

Switch over to [**Users**](https://console.aws.amazon.com/iam/home#/users) and click **Add user**.

Enter a **User name**, for example "inet-swarm-cli", and tick the checkbox next to **Programmatic access**. Leave the other checkbox unchecked. Click **Next: Permissions**. Select **Attach existing policies directly**, search for the name of the policy we just created *(by typing in a part of it, like "inet")*, then check the checkboy next to it, and click **Next: Review** at the bottom. If everything looks alright, click **Create user**.

As the final step of user creation, save the **Access key ID** and the **Secret access key**, somewhere safe. It's a good idea that you do this by clicking **Download .csv**. This will let you download this information into a simple text file, so you won't make any mistakes while copy-pasting them.

Also, read the notice in the green area, particularly this part: "This is the last time these credentials will be available to download. However, you can create new credentials at any time.". This means that if you don't save the key ID and the secret key now, you will have to delete this user and create a new one.

**Important!** Keep these strings private, since these grant access to your account, without the need for your password or other credentials *(of course, only until you delete this user, or revoke its permissions)*. Treat them with similar caution as you do your passwords.


#### Configuring CLI Access

To let your computer manage and use your AWS account, we have to configure it with the credentials of the user you just created for it.
First we need to install the AWS CLI utility using `pip`:

`$ pip3 install --upgrade awscli`

Then start the configuration:

`$ aws configure`

If at first you get `aws: command not found`, or `The program 'aws' is currently not installed`, try running `~/.local/bin/aws configure` instead.

When asked, enter the **Access Key ID**, then the **Secret Access Key**. They will be recorded into an INI file, which is by default at `~/.aws/credentials`.

For **Default region**, choose the one closest to you geographically. You can find the list of region codes and their locations
[here](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html#concepts-available-regions).
In my case, the Frankfurt datacenter was closest, so I entered `eu-central-1`. This setting is recorded in the `~/.aws/config` file.
You can find more info about Regions and Availability Zones 
[here](https://docs.aws.amazon.com/general/latest/gr/rande.html),
[here](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html), and
[here](https://aws.amazon.com/about-aws/global-infrastructure/).

You can leave **Default output format** empty.

**Note:** Once all this information is entered correctly, any software you run on your computer has access to your AWS account, as permitted by the policy attached to the configured user. Remove (rename) the `credentials` file mentioned above to (temporarily) disable access. The proper way to completely and permanently revoke this access is to delete the IAM User we just created.

From this point on in this tutorial, we won't need the AWS Management Console to initiate any actions. However, if you wish, you can use it to observe and check for yourself what the `aws_swarm_tool.py` script does.




### Installing Local Client Scripts

Having set up your AWS account and access to it, we can proceed by installing the client-side tools for submitting simulations.

First, install the required Python libraries:

`$ pip3 install boto3 psutil pymongo redis rq`

Save the following files into `~/bin`: [aws_swarm_tool.py](code/aws_swarm_tool.py),
[docker-compose.yml](code/docker-compose.yml), [inet_runall_swarm.py](code/inet_runall_swarm.py)

Issue the following commands:

`$ export PATH=$PATH:$HOME/bin`

`$ aws_swarm_tool.py init`



## Usage

If the Swarm is not already running, you have to start it up again:

`$ aws_swarm_tool.py resume`

Change into the directory under INET (your INET fork) that contains your simulation. 

IMPORTANT: Your INET installation should be a checked-out copy of a GitHub repository with all changes pushed up to GitHub, 
because our tool only sends the Git URL of your project and the hash of the currently checked-out commit to AWS, not the full source code.

`$ cd examples/inet/ber`

Enter the command for running the simulations, but replace `inet` in it with our `inet_runall_swarm.py` program:

`$ inet_runall_swarm.py -c ber-flavour-experiment`

The `inet_runall_swarm.py` tool will expand the list of simulation runs to be executed, submits them to the job queue, and wait for the jobs to finish.
The results will be downloaded automatically into the `results` folder.

You can monitor progress at http://localhost:9181/ which displays the content of the job queue.

If you are done with it, you can stop the machines:

`$ aws_swarm_tool.py halt`

They will shut down automatically after an hour of being idle.


