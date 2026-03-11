const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo config plugin to fix op-sqlite duplicate libsql.h header issue
 * when using useFrameworks: "static".
 */
function withIosBuildFixes(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );
      let podfileContents = fs.readFileSync(podfilePath, "utf8");

      const postInstallSnippet = `
    # Fix op-sqlite duplicate libsql.h header issue
    installer.pods_project.targets.each do |target|
      if target.name == 'op-sqlite'
        header_phases = target.build_phases.select { |bp| bp.is_a?(Xcodeproj::Project::Object::PBXHeadersBuildPhase) }
        header_phases.each do |phase|
          seen = {}
          phase.files.to_a.each do |file|
            if file.display_name == 'libsql.h'
              if seen[file.display_name]
                phase.remove_build_file(file)
              else
                seen[file.display_name] = true
              end
            end
          end
        end

        copy_phases = target.build_phases.select { |bp| bp.is_a?(Xcodeproj::Project::Object::PBXCopyFilesBuildPhase) }
        copy_phases.each do |phase|
          seen = {}
          phase.files.to_a.each do |file|
            if file.display_name == 'libsql.h'
              if seen[file.display_name]
                phase.remove_build_file(file)
              else
                seen[file.display_name] = true
              end
            end
          end
        end
      end
    end`;

      if (podfileContents.includes("post_install do |installer|")) {
        podfileContents = podfileContents.replace(
          "post_install do |installer|",
          `post_install do |installer|${postInstallSnippet}`
        );
      } else {
        const lastEnd = podfileContents.lastIndexOf("end");
        podfileContents =
          podfileContents.slice(0, lastEnd) +
          `\n  post_install do |installer|${postInstallSnippet}\n  end\n` +
          podfileContents.slice(lastEnd);
      }

      fs.writeFileSync(podfilePath, podfileContents);
      return config;
    },
  ]);
}

module.exports = withIosBuildFixes;
